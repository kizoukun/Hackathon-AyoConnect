const mongoose = require('mongoose');

const schema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
        },
        membershipId: {
            type: String,
            required: true
        },
        expiry: {
            type: Date,
            required: true,
        },
        price: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            required: true
        },
        usedCard: {
            type: Object,
            required: true,
        },
        createdAt: {
            type: Date,
            required: false
        },
        updatedAt: {
            type: Date,
            required: false
        }
    }
);

const Subscriptions = mongoose.model('catalysts_subscriptions', schema);


module.exports = Subscriptions;