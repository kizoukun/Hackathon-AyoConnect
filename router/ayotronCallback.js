const express = require('express');
const router = express.Router();
const USERS = require('../models/users');


/**
 * URL /callback/ayotron/binding 
 * to handle binding callback request from ayotron
 */

router.get('/bind', async (req, res) => {
    if(res.locals.USER === null || res.locals.USER === undefined) {
        return res.json({success: false, message: "You must logged in to bind your account"})
    }
    const findUser = await USERS.findOneAndUpdate({email: res.locals.USER.email}, {
        ayoconnectCustomerId: req.query.ayoconnectCustomerId
    });
    return res.redirect("/dashboard/cards")
})


router.post('/binding', (req, res) => {
    //console.log(req.query);
    //console.log(req.headers);
    //console.log(req.body)
    return res.status(201).json({success: true})
})

/**
 * URL /callback/ayotron/unbind 
 * to handle unbinding callback request from ayotron
 */

router.post('/unbinding', (req, res) => {
    //console.log(req.query);
    //console.log(req.headers);
    //console.log(req.body)
    return res.status(201).json({success: true})
})


/**
 * URL /callback/ayotron/payment
 * to handle payment callback request from ayotron
 */

router.post('/payment', (req, res) => {
    //console.log(req.query);
    //console.log(req.headers);
    //console.log(req.body)
    return res.status(201).json({success: true})
})


module.exports = router;