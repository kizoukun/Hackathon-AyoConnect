const mongoose = require('mongoose');
const {takePayment} = require('./takePayment');

mongoose.connect(process.env.MONGODB_URL, err => {
    if (err) throw err;
    takePayment();
    console.log('Connected to MONGODB')
})