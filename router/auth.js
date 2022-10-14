const express = require('express');
const router = express.Router();
const USERS = require('../models/users');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Middleware for if user is loggedIn
 */
router.use((req, res, next) => {
    if(res.locals.USER !== null) {
        return res.redirect('/')
    }
    next()
})


/**
 * Handle /auth/login
 */

router.route('/login')
    /**
     * Handle /auth/login GET request return page
     */
    .get((req, res) => {        
        return res.render('auth/login');
    })
    /**
     * Handle /auth/login POST Request
     */
    .post(async (req, res) => {
        const {email, password} = req.body;
        // Check if form is valid
        if(email === undefined || password === undefined) {
            return res.json({success: false, message: "Form is not valid"});
        }
        // Find the user then check if user is exists or not     
        const findUser = await USERS.findOne({email: email});
        if(findUser === undefined || findUser === null) {
            return res.json({success: false, message: "Email or password is incorrect"});
        }
        // Validate password is the same or not
        const passwordValidation = await bcrypt.compare(password, findUser.password);
        if(!passwordValidation) return res.json({success: false, message: "Email or password is incorrect"});
        const userData = {
            id: findUser._id.toString(),
            email: findUser.email,
            username: findUser.username,
            firstName: findUser.firstName,
            lastName: findUser.lastName,
        }
        const accessToken = jwt.sign(userData, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "7d"});
        res.cookie('AUTH-TOKEN', accessToken, {
            httpOnly: true,
            maxAge: 7*24*60*60*1000
        })
        // return success
        return res.json({success: true, message: "Success login"})
    })

router.route('/register')
    /**
     * Handle /auth/register GET request return page
     */
    .get((req, res) => {
        return res.render('auth/register');
    })
    /**
     * Handle /auth/register POST Request
     */
    .post(async (req, res) => {
        const {email, username, firstName, lastName, password} = req.body;
        // Check if form is valid
        if(email === undefined || username === undefined || firstName === undefined || lastName === undefined || password === undefined) {
            return res.json({success: false, message: "Form is not valid"});
        }
        // Find the user then check if user is exists or not. If exists then return email already exists
        const findUser = await USERS.findOne({email: email});
        if(findUser !== undefined && findUser !== null) {
            return res.json({success: false, message: "This email already exists"});
        }
        // Hashing the password for security purposes
        const hashPassword = await generatePassword(password);
        // Save the user
        const dateNow = new Date();
        await (new USERS({
            email: email,
            username: username,
            firstName: firstName,
            lastName: lastName,
            password: hashPassword,
            updatedAt: dateNow,
            createdAt: dateNow
        }).save())
        // return success
        return res.json({success: true, message: "Account Created"})
    })



    /**
     * generate Hash Password
     * @param {text} password 
     * @returns hashedPassword
     */
function generatePassword(password) {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, function(err, hash) {
            if(err) return reject(err);
            resolve(hash);
        });
    })
}

module.exports = router;