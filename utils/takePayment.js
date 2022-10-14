const MEMBERSHIPS = require('../models/memberships');
const SUBSCRIPTIONS = require('../models/subscriptions');
const USERS = require('../models/users');
const AYOTRON = require('./ayotron');
const AyoTron = new AYOTRON();

async function takePayment() {
    while(true) {        
        console.log(`[${new Date().toLocaleString()}] Running take payment`)
        try {
            const subscriptions = await SUBSCRIPTIONS.find({status: "ACTIVE"}).sort({expiry: 1});
            for(var subscription of subscriptions) {
                const dateNow = new Date().getTime();
                const expiryDate = new Date(subscription.expiry).getTime();
                if(dateNow < expiryDate) continue;
                const user = await USERS.findById(subscription.userId);
                const membership = await MEMBERSHIPS.findById(subscription.membershipId);
                if(user.ayoconnectCustomerId === null || user.ayoconnectCustomerId === undefined || user.ayoconnectCustomerId.length < 1) {
                    await setSubscriptionSuspend(subscription._id.toString())
                    continue;
                }
                const getCards = await AyoTron.getCards(user.ayoconnectCustomerId);
                if(getCards.cards.length < 1) {
                    await setSubscriptionSuspend(subscription._id.toString())
                    continue;
                }
                const usedCard = getCards.cards.find(card => card.banks.code === subscription.usedCard.code);
                if(usedCard.status !== "active") {
                    await setSubscriptionSuspend(subscription._id.toString())
                    continue;
                }
                const chargeCard = await AyoTron.chargeCards(user.ayoconnectCustomerId, usedCard.ayoconnectToken, usedCard.banks.code, membership.price);
                if(chargeCard.code !== 201) {
                    await setSubscriptionSuspend(subscription._id.toString())
                    continue;
                }
                const chargeCardVerification = await AyoTron.chargeCardsVerification(user.ayoconnectCustomerId, usedCard.ayoconnectToken, chargeCard.chargePayment.chargeToken, usedCard.banks.code, chargeCard.correletion)
                if(chargeCardVerification.code !== 201) {
                    await setSubscriptionSuspend(subscription._id.toString())
                    continue;
                }
                const newExpDate = new Date(subscription.expiry)
                const newExpiry = new Date(newExpDate.getFullYear(), newExpDate.getMonth() + 1, newExpDate.getDate());
                console.log(`[${new Date().toLocaleString()}] Successfully charge ${user.email} subscription`)
                await SUBSCRIPTIONS.findByIdAndUpdate(subscription._id.toString(), {
                    expiry: newExpiry,
                    updatedAt: new Date()
                })
            }
        } catch (err) {
            console.log(err);
        }
        console.log(`[${new Date().toLocaleString()}] Done running take payment next schedule 21600 seconds`)
        await sleep(21600);
    }
}

async function setSubscriptionSuspend(subscriptionId) { 
    await SUBSCRIPTIONS.findByIdAndUpdate(subscriptionId, {
        status: "SUSPENDED",
        updatedAt: new Date(),
    })
    return;
}

function sleep(ms) {
    ms = ms * 1000
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {takePayment}