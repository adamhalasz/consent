// Load required packages
var mongoose = require('mongoose');

// Define our client schema
var AccessTokenSchema = new mongoose.Schema({
    value       : { type: String, required: true },
    user_id     : { type: String, required: true },
    client_id   : { type: String, required: true },
    scope       : { type: Array, default: [] },
    expires_in  : { type: Number, default: 3600 },
    expire_time : { type: Date, required: true },
    createdAt   : { type: Date, required: true }
});

// Export the Mongoose model
module.exports = mongoose.model('AccessToken', AccessTokenSchema);