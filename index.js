/**
 * all packages
 */
require('dotenv').config()
const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = process.env.PORT || 4000;
const mongoose = require('mongoose');
const morgan = require('morgan')
//Connecting to MONGODB Database
require('./utils/mongodb')

/**
 * Handle all router
 */
const AYOTRONCALLBACKROUTER = require('./router/ayotronCallback');
const AUTHROUTER = require('./router/auth');
const DASHBOARDROUTER = require('./router/dashboard')

/**
 * Handle all utils
 */

const AUTHENTICATION = require('./utils/authenticate');
const AYOTRON = require('./utils/ayotron');
const AyoTron = new AYOTRON();

/**
 * Handle all models or databases
 */
const MEMBERSHIPS = require('./models/memberships');
const USERS = require('./models/users');
const SUBSCRIPTIONS = require('./models/subscriptions');

/**
 * Handle all View Engine and uses
 */
 app.use(morgan('[:date[web]] :remote-addr :method :url :status - :response-time ms'))
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(AUTHENTICATION)
/**
 * Use all the router
 */

app.use('/callback/ayotron', AYOTRONCALLBACKROUTER);
app.use('/auth', AUTHROUTER)
app.use('/dashboard', DASHBOARDROUTER)

app.get('/', (req, res) => {
    return res.render('index')
})

app.get('/faq', (req, res) => {
    return res.render('faq')
})


app.get('/logout', (req, res) => {
    res.clearCookie('AUTH-TOKEN');
    res.redirect('/')
})

app.get('/subs/:id', async (req, res) => {
    const findUser = await USERS.findOne({username: req.params.id});
    if(findUser === null) {
        return res.redirect('/');
    }
    const memberships = await MEMBERSHIPS.find({ownedBy: findUser._id.toString()}).sort({sortId: 1});
    return res.render('memberships', {
        memberships: memberships
    })
})

app.post('/subs/:id', async (req, res) => {
    try {
        const {memberId, paymentMethod} = req.body;
        const findUser = await USERS.findOne({username: req.params.id});
        if(findUser === null) {
            return res.json({success: false, message: "User not found"})
        }
        if(res.locals.USER === null || res.locals.USER === undefined) {
            return res.json({success: false, message: "You must be logged in to purchase memberships"})
        }
        if(findUser._id.toString() === res.locals.USER.id) {
            return res.json({success: false, message: "You cannot purchase your own memberships"})
        }
        if(!mongoose.isValidObjectId(memberId)) {
            return res.json({success: false, message: "Membership not found"})
        }
        const membership = await MEMBERSHIPS.findById(memberId);
        if(membership === null || membership === undefined) {
            return res.json({success: false, message: "Membership not found"})
        }
        const getUser = await USERS.findById(res.locals.USER.id);
        if(getUser === null || getUser === undefined) {
            return res.json({success: false, message: "You must be logged in to purchase memberships"})
        }
        const ownedMembership = await SUBSCRIPTIONS.find({userId: getUser._id.toString(), membershipId: membership._id.toString(), status: "ACTIVE"});
        if(ownedMembership.length > 0) {
            return res.json({success: false, message: "You already own this membership!"})
        }
        const cards = await AyoTron.getCards(getUser.ayoconnectCustomerId);
        if(cards.code !== 200) {
            return res.json({success: false, message: cards.message})
        }
        if(cards.cards.length < 1) {
            return res.json({success: false, message: "You don't have any active cards. Please add new active cards"})
        }
        const activeCards = cards.cards.filter(card => card.status === "active");
        if(activeCards.length < 1) {
            return res.json({success: false, message: "You don't have any active cards. Please add new active cards"})
        }
        const selectedCards = activeCards.find(card => card.banks.code === paymentMethod);
        if(selectedCards === null || selectedCards === undefined) {
            return res.json({success: false, message: "You don't have any cards with this payment method. Please add new cards"})
        }
        const charge = await AyoTron.chargeCards(getUser.ayoconnectCustomerId, selectedCards.ayoconnectToken, selectedCards.banks.code, membership.price)
        if(charge.code !== 201) {
            return res.json({success: false, message: charge.message});
        }
        const dateNow = new Date();
        const expiry = new Date(dateNow.getFullYear(), dateNow.getMonth() + 1, dateNow.getDate())
        const data = await (new SUBSCRIPTIONS({
            userId: getUser._id.toString(),
            membershipId: membership._id.toString(),
            expiry: expiry,
            price: membership.price,
            status: "PENDING",
            usedCard: {
                "code": selectedCards.banks.code,
                "name": selectedCards.banks.name,
                "correletionId": charge.correletion,
                "chargeToken": charge.chargePayment.chargeToken,
                "cardToken": selectedCards.ayoconnectToken
            },
            createdAt: dateNow,
            updatedAt: dateNow,
        }).save())
        return res.json({success: true, message: "ok", subscriptionId: data._id.toString()})
    } catch (err) {
        console.log(err)
        return res.json({success: false, message: err.message})
    }
})

app.post('/subs/:id/verification', async (req, res) => {
    try {

        const {subscriptionId, otpCode} = req.body;
        if(subscriptionId === undefined || otpCode === undefined) {
            return res.json({success: false, message: "Form is not valid"})
        }
        if(!mongoose.isValidObjectId(subscriptionId)) {
            return res.json({success: false, message: "Subscription not found"})
        }
        const subscription = await SUBSCRIPTIONS.findById(subscriptionId);
        if(subscription === null || subscription === undefined) {
            return res.json({success: false, message: "Subscription not found"})
        }
        if(subscription.status !== "PENDING") {
            return res.json({success: false, message: "Failed to purchase membership. not a PENDING payment"})
        }
        const getUser = await USERS.findById(res.locals.USER.id);
        if(getUser === null || getUser === undefined) {
            return res.json({success: false, message: "User not found"})
        }
        const chargeVerification = await AyoTron.chargeCardsVerification(getUser.ayoconnectCustomerId, subscription.usedCard.cardToken, subscription.usedCard.chargeToken, subscription.usedCard.code, subscription.usedCard.correletionId, otpCode)
        
        if(chargeVerification.code !== 201 || chargeVerification.chargePayment.paymentStatus !== "SUCCESS") {
            return res.json({success: false, message: chargeVerification.message})
        }
        const dateNow = new Date();
        const expiry = new Date(dateNow.getFullYear(), dateNow.getMonth() + 1, dateNow.getDate())
        await SUBSCRIPTIONS.findByIdAndUpdate(subscriptionId, {
            status: "ACTIVE",
            expiry: expiry,
            updatedAt: dateNow
        })
        return res.json({success: true, message: "ok"})
    } catch (err) {
        if(err.response && err.response.data) {
            if(err.response.data.code === 412) {
                return res.json({success: false, message: err.response.data.errors[0].details})
            }
        }
        return res.json({success: false, message: err.message})
    }
})

app.listen(PORT, () => {
    console.log('Listening ' + PORT)
})