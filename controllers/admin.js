// =======================================================
//  Modules
// =======================================================
    var uid = require('uid');
    var async = require('async');

// =======================================================
//  Models
// =======================================================
    var Client = require('../models/client');
    var AccessToken = require('../models/access_token');
    var RefreshToken = require('../models/refresh_token');
    var Grant = require('../models/grant');

// =======================================================
//  Controllers
// =======================================================
    var OAuthController = require('../controllers/oauth');
    var AdminController = require('../controllers/admin');

// =======================================================
//  Exports
// =======================================================
module.exports.session = function($){
    if($.cookies.session = 'ifu8b7p5'){
        $.user = {
            username: 'admin',
            password: 'xxx'
        }
        $.return();
    } else {
        $.return();
    }
}

module.exports.home = function home($){
    async.parallel([getClients, getGrants, getAccessTokens, getRefreshTokens], finish);
    
    function getGrants(done){
        Grant.find({}, function(error, grants){
            if(error) throw error;
            $.data.grants = grants;
            done();
        });
    }
    function getAccessTokens(done){
        AccessToken.find({}, function(error, tokens){
            if(error) throw error;
            $.data.accessTokens = tokens;
            done();
        });
    }
    function getRefreshTokens(done){
        RefreshToken.find({}, function(error, tokens){
            if(error) throw error;
            $.data.refreshTokens = tokens;
            done();
        });
    }
    
    function getClients(done){
        Client.find({}, function(error, clients){
            if(error) throw error;
            $.data.clients = clients;
            done();
        });
    }
    
    function finish(){
        $.data.page = 'oauth_admin';
        $.html();
    }
}

module.exports.createClient = function createClient($){
    var client = new Client();
    client.name = $.body.name;
    client.client_id = uid(16);
    client.client_secret = uid(32);
    client.callbacks = [];
    $.body.callbacks.split(',').forEach(function(callback){
        client.callbacks.push(callback.trim());
    });
    client.save(function(error){
        if(error) throw error;
        $.redirect('back');
    }); 
}

module.exports.deleteClient = function deleteClient($){
    Client.findOne({ client_id: $.params.client_id }, function(error, client){
        if(error) throw error;
        if(client){
            client.remove(function(error){
                if(error) throw error;
                $.redirect('back');
            })
        } else {
            $.status(404);
            $.end('Client not found with this id: ' + $.params.client_id);
        }
    });
}