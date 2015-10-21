// Load required packages
var mongoose = require('mongoose');

// Define our client schema
var RefreshTokenSchema = new mongoose.Schema({
    value      : { type: String, required: true },
    user_id    : { type: String, required: true },
    client_id  : { type: String, required: true },
    createdAt  : { type: Date, required: true }
});

// Export the Mongoose model
module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);