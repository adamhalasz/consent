// =======================================================
//  Dependencies
// =======================================================
    var mongoose = require('mongoose');

// =======================================================
//  Exports
// =======================================================
    module.exports = function exports(options, address, callback){
        // Mongoose: initialize connect 
        mongoose.connect(address);
        
        // Mongoose: open event handler
        mongoose.connection.on('open', function(){
            if(options.log) console.log(' ... Mongoose connection established (oauth).');
            if(callback) callback();
        });
        
        // Mongoose: error event handler
        mongoose.connection.on('error', function(error){
            console.error('Mongoose connection failed to establish (ouath): ', error);
        });
    }