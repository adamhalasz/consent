// Load required packages
var mongoose = require('mongoose');

// Define our grant schema
var GrantSchema = new mongoose.Schema({
    code          : { type: String, required: true },
    client_id     : { type: String, required: true },
    user_id       : { type: String, required: true },
    response_type : { type: String },
    scope         : { type: Array, default: [] },
    state         : { type: String },
    redirect_uri  : { type: String },
    used          : { type: Boolean, default: false }
});

// Export the Mongoose model
module.exports = mongoose.model('Grant', GrantSchema);