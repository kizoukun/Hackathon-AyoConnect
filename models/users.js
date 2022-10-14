const mongoose = require('mongoose');

const schema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true
        },
        username: {
            type: String,
            required: true,
        },
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true
        },
        ayoconnectCustomerId: {
            type: String,
            required: false,
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

const Users = mongoose.model('catalysts_users', schema);


module.exports = Users;