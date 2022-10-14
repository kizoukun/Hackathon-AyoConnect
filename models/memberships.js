const mongoose = require('mongoose');

const schema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true,
        },
        sortId: {
            type: Number,
            required: true,
        },
        ownedBy: {
            type: String,
            required: true
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

const Memberships = mongoose.model('catalysts_memberships', schema);


module.exports = Memberships;