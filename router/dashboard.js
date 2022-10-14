const express = require('express');
const router = express.Router();
const MEMBERSHIPS = require('../models/memberships');
const USERS = require('../models/users');
const AYOTRON = require('../utils/ayotron');
const SUBSCRIPTIONS = require('../models/subscriptions');

const Ayotron = new AYOTRON();
router.use((req, res, next) => {
    if(res.locals.USER === null) {
        res.redirect('/')
    }
    next();
})

router.get('/', (req, res) => {
    return res.render('dashboard/dashboard')
})

router.route('/memberships')
    .get(async (req, res) => {
        const memberships = await MEMBERSHIPS.find({ownedBy: res.locals.USER.id});
        return res.render('dashboard/memberships', {
            memberships: memberships
        })
    })
    .post(async (req, res) => {
        const {title, description, imageurl, price, sortId} = req.body;
        if(title === undefined || description === undefined || imageurl === undefined || price === undefined || sortId === undefined) {
            return res.json({success: false, message: "Form is invalid"})
        }
        if(isNaN(price)) {
            return res.json({success: false, message: "Price is not a number"})
        }
        if(isNaN(sortId)) {
            return res.json({success: false, message: "Sort ID is not a number"})
        }
        const dateNow = new Date();
        await (new MEMBERSHIPS({
            title: title,
            description: description,
            image: imageurl,
            price: parseInt(price),
            sortId: parseInt(sortId),
            ownedBy: res.locals.USER.id,
            updatedAt: dateNow,
            createdAt: dateNow
        }).save())
        return res.json({success: true})
    })
    .patch(async (req, res) => {
        const {id, title, description, imageurl, price, sortId} = req.body;
        if(id === undefined || title === undefined || description === undefined || imageurl === undefined || price === undefined || sortId === undefined) {
            return res.json({success: false, message: "Form is invalid"})
        }
        if(isNaN(price)) {
            return res.json({success: false, message: "Price is not a number"})
        }
        if(isNaN(sortId)) {
            return res.json({success: false, message: "Sort ID is not a number"})
        }
        const dateNow = new Date();
        await MEMBERSHIPS.findByIdAndUpdate(id, {
            title: title,
            description: description,
            image: imageurl,
            price: parseInt(price),
            sortId: parseInt(sortId),
            updatedAt: dateNow,
        })
        return res.json({success: true})
    })

router.route('/cards')
    .get(async (req, res) => {
        let cards = []
        try {
            const findUser = await USERS.findOne({email: res.locals.USER.email});
            const getData = await Ayotron.getCards(findUser.ayoconnectCustomerId);
            for(var data of getData.cards) {
                cards.push(
                    {
                        maskedCard: data.maskedCard,
                        status: data.status,
                        banks: data.banks,
                    }
                )
            }
        } catch (err) {
            console.log(err.response.data);
        } finally {
            return res.render('dashboard/cards', {
                cards: cards,
            })
        }
    })
    .post(async (req, res) => {
        try {
            const webView = await Ayotron.generateWebview(res.locals.USER.email);
            if(webView.code !== 201) {
                return res.json({success: false, message: webView.message})
            }
            return res.json({success: true, message: "success", url: webView.webview.URL});
        } catch (err) {
            return res.json({success: false, message: err.message})
        }
    })
    .delete(async (req, res) => {
        try {
            const { bankCode } = req.query
            if(bankCode === undefined) {
                return res.json({success: false, message: "Form is not valid"})
            }
            const findUser = await USERS.findOne({email: res.locals.USER.email});
            const getCards = await Ayotron.getCards(findUser.ayoconnectCustomerId);
            const cards = getCards.cards;
            const card = cards.find((card) => card.banks.code === bankCode)
            if(card === null || card === undefined) {
                return res.json({success: false, message: "Cards not found"})
            }
            if(card.status !== "active") {
                return res.json({success: false, message: "Cards already inactive"})
            }
            const unbindCard = await Ayotron.unbindCards(findUser.ayoconnectCustomerId, card.ayoconnectToken);
            if(unbindCard.code !== 200) {
                return res.json({success: false, message: unbindCard.message})
            }
            return res.json({success: true, message: "ok"})
        } catch (err) {
            return res.json({success: false, message: err.message})
        }
    })

router.route('/subscription')
    .get(async (req, res) => {
        const subscriptions = [];
        const getSubs = await SUBSCRIPTIONS.find({userId: res.locals.USER.id});
        for(var subs of getSubs) {
            const membership = await MEMBERSHIPS.findById(subs.membershipId);
            if(membership === null || membership === undefined) continue;
            subscriptions.push(
                {
                    id: subs._id.toString(),
                    membershipId: subs.membershipId,
                    expiry: subs.expiry,
                    price: subs.price,
                    status: subs.status,
                    membershipDetails: {
                        title: membership.title,
                    }
                }
            )
        }
        return res.render('dashboard/subscriptions', {
            subscriptions: subscriptions
        })
    })
    .post(async (req, res) => {
        try {
            const {subscriptionId} = req.query;
            if(subscriptionId === undefined) {
                return res.json({success: false, message: 'Form is not valid'})
            }
            await SUBSCRIPTIONS.findByIdAndUpdate(subscriptionId, {
                status: "CANCELLED",
                updatedAt: new Date()
            })
            return res.json({success: true, message: 'ok'})
        } catch (err) {
            return res.json({success: false, message: err.message})
        }
    })

router.route('/subscriber')
    .get(async (req, res) => {
        const subscriber = [];
        try {
            const memberships = await MEMBERSHIPS.find({ownedBy: res.locals.USER.id});
            for(var membership of memberships) {
                const subscription = await SUBSCRIPTIONS.find({membershipId: membership._id.toString()});
                for(var subscribed of subscription) {
                    const subscriberUser = await USERS.findById(subscribed.userId);
                    subscriber.push(
                        {
                            fullName: subscriberUser.firstName + ' ' + subscriberUser.lastName,
                            email: subscriberUser.email,
                            username: subscriberUser.username,
                            membershipId: membership._id.toString(),
                            expiry: subscribed.expiry,
                            status: subscribed.status,
                            title: membership.title
                        }
                    )
                }
            }
        } catch (err) {
            console.log(err);
        } finally {
            return res.render('dashboard/subscriber', {subscriber: subscriber})

        }
        // const subscriber = await SUBSCRIPTIONS.find()
    })

module.exports = router;