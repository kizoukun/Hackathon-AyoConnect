const jwt = require('jsonwebtoken');
const USERS = require('../models/users');

function authenticateToken(req, res, next) {
    const accessToken = req.cookies['AUTH-TOKEN'];
    if(accessToken == null) {
        res.clearCookie('AUTH-TOKEN');
        res.locals.USER = null;
        next();
        return;
    };
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
        if(err) {
            res.clearCookie('AUTHORIZE-TOKEN');
            res.locals.USER = null;
            next();
            return;
        }
        res.locals.USER = user;
        next();
    })
}

function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
}


module.exports = authenticateToken;
