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

module.exports.requestAccess = function($, callback){
    if($.header('authorization')){
        console.log('OAuth: Request Access', $.header('authorization'))
        var access_token = $.header('authorization').split('Bearer ')[1];
        AccessToken.findOne({ value: access_token }, function(error, token){
            if(error) throw error;
            if(token){
                callback(error, token);
            } else {
                invalid_request($);
            }
        });
    } else {
        invalid_request($);
    }
}

module.exports.accessTokenRequest = function($){
    if($.query.client_id && $.query.code){
        console.log('POST /oauth/accessTokenRequest', $.query);
        Grant.findOne({ code: $.query.code, client_id: $.query.client_id, used: false }, function(error, grant){
            if(error) { console.log('Grant Request Error'); throw error; }
            console.log('POST /oauth/accessTokenRequest -> Grant found', grant);
            if(grant){
                
                
                grant.used = true;
                grant.save(function(error){
                    if(error) { console.log('Grant Save Error'); throw error; }
                });
                
                var accessToken = new AccessToken();
                accessToken.value = uid(256) + '=';
                accessToken.user_id = $.user._id;
                accessToken.client_id = $.query.client_id;
                accessToken.expires_in = 3600;
                accessToken.createdAt = new Date();
                accessToken.expire_time = new Date(accessToken.createdAt.getTime() + accessToken.expires_in * 1000);
                accessToken.scope = grant.scope;
                
                accessToken.save(function(error){
                    if(error) { console.log('Access Token Save Error'); throw error; }
                });
                
                // if offline access was granted
                if(grant.scope.indexOf('offline_access') != -1){
                    var refreshToken = new RefreshToken();
                    refreshToken.value = uid(256) + '=';
                    refreshToken.user_id = $.user._id;
                    refreshToken.client_id = $.query.client_id;
                    refreshToken.createdAt = new Date();
                    refreshToken.save(function(error){
                        if(error) { console.log('Refresh Token Save Error'); throw error; }
                    });
                }
                
                // construct response
                var response = new Object();
                    response.expires_in = accessToken.expires_in;
                    response.expire_time = accessToken.expires_time;
                    response.access_token = accessToken.value;
                if(refreshToken) response.refresh_token = refreshToken.value;
                
                // send response
                $.json(response);
            } else {
                invalid_request($);
            }
        });
        
        
    } else {
        invalid_request($);
    }
}

module.exports.authorizationRequest = function($){
    if( $.query.response_type                 // does response_type exist?
     && $.query.client_id                     // does the client_id exist?
     && $.query.response_type == 'code'        // is the response_type correct?
    ) {
        console.log('query', $.query);
        console.log('$.user dialog', $.user);
        
        Client.findOne({ client_id: $.query.client_id }, function(error, client){
            if(error) throw error;
            if(client){
                $.client = client;
                // check login state
                displayDialog();
                /*
                if($.user){
                    issueGrant();
                } else {
                    displayDialog();
                }*/
                
            } else {
                invalid_request($);
            }
        });    
        
    } else {
        invalid_request($);
    }
    
    function displayDialog(){
        $.data.page = 'oauth_dialog';
        $.data.client_id = $.query.client_id;
        $.data.response_type = $.query.response_type;
        $.data.user = $.user;
        $.data.client = $.client;
        
        
        
        if($.query.redirect_uri) $.data.redirect_uri = $.query.redirect_uri;
        if($.query.state) $.data.state = $.query.state;
        if($.query.response_format) $.data.response_format = $.query.response_format;
        if($.query.scope) {
            var scopes = [];
            $.query.scope.split(',').forEach(function(scope){
                scopes.push(scope.trim());
            });
            $.data.scope = scopes;
        }
        
        $.data.oauth_redirect = $.url.href;
        $.data.oauth_accept = '/oauth/authorizationRequest/accept'+$.url.search
        $.data.oauth_decline = '/oauth/authorizationRequest/decline'+$.url.search
        $.oauth.dialog($);
    }
}

module.exports.acceptAuthorizationRequest = function($) {
    if($.user){
        var grant               = new Grant();
        
        grant.code              = uid(32);
        grant.response_type     = $.query.response_type;
        grant.client_id         = $.query.client_id;
        grant.user_id           = $.user._id;
        grant.used              = false;
        
        if($.query.redirect_uri) grant.redirect_uri = $.query.redirect_uri;
        if($.query.scope) {
            var scopes = [];
            $.query.scope.split(',').forEach(function(scope){
                scopes.push(scope.trim());
            });
            console.log('Grant Scopes:', scopes);
            grant.scope = scopes;
        }
        if($.query.state) grant.state = $.query.state;
        
        grant.save(function(error){
            if(error) throw error;
            if($.query.response_format == 'pushMessage'){
                var script  = '<!DOCTYPE html>';
                    script += '<html><head><title>Response</title></head><body>';
                    script += '<script>';
                    script +=     'window.opener.window.postMessage(\''+JSON.stringify({ oauth: true, code: grant.code })+'\', "*");';
                    script +=     'window.close();';
                    script += '</script>';
                    script += '</body>'
                $.header('content-type', 'text/html');
                $.end(script);
            
            } else if ($.query.redirect_uri) {
                $.redirect($.query.redirect_uri + '?code=' + grant.code);
                
            } else {
                $.json({ code: grant.code, user_id: $.user._id });
            }
        });
    }
}

function invalid_request($){
    console.trace('Invalid Request')
    $.json({
        error: {
            invalid_request: 'The request is missing a required parameter, includes an invalid parameter value, includes a parameter more than once, or is otherwise malformed.'
        }
    });
}

module.exports.invalid_request = invalid_request;