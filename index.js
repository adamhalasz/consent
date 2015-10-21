// =======================================================
//  Controllers
// =======================================================
    var OAuthController = require('./controllers/oauth');
    var AdminController = require('./controllers/admin');

// =======================================================
//  Exports
// =======================================================

    function Consent(key, value){
        var consent = this;
        function Configure(key, value){
            if(consent.configure[key]){
                consent.configure[key](value);
            } else {
                console.error('Consent: "' + key + '" configuration handler not found (value="'+value+'")');
            }
        };
        Configure.requestAccess = OAuthController.requestAccess; 
        
        return Configure;
    }
    
    Consent.prototype.options = function($){
        $.oauth = {};
        $.oauth.dialog = Consent.prototype.dialog;
        console.log('dialog', Consent.prototype.dialog);
        $.return();
    }
    Consent.prototype.app = false;
    Consent.prototype.log = false;
    Consent.prototype.session = function($){ 
        if(Consent.prototype.customSession) { 
            Consent.prototype.customSession($);
        } else {
            $.status(500, 'Consent Session Not Configured');
            $.data = {};
            $.end({ error: 'Consent Session Not Configured'});
        }
    }
    Consent.prototype.dialog = function($){ 
        if(Consent.prototype.customDialog) { 
            Consent.prototype.customDialog($);
        } else {
            $.data = {};
            $.status(500, 'Consent Dialog Not Configured');
            $.data = {};
            $.end({ error: 'Consent Dialog Not Configured'});
        }
    }
    Consent.prototype.namespace = 'oauth';
    Consent.prototype.configure = new Object();
    Consent.prototype.configure.parent = Consent.prototype;
    Consent.prototype.configure.log = function(value){ this.log = true; }
    Consent.prototype.configure.dialog = function(handler){
        this.parent.customDialog = handler;
    }
    Consent.prototype.configure.session = function(handler){
        this.parent.customSession = handler;
    }
    Consent.prototype.configure.namespace = function(value){
        this.parent.namespace = value;
    }
    Consent.prototype.configure.database = function(address){
        require('./controllers/mongoose')(this, address);
    }
    Consent.prototype.configure.app = function(app){
        this.parent.app = app;
        app.get('/'+this.parent.namespace+'/authorizationRequest', 
            this.parent.options, 
            this.parent.session, 
            OAuthController.authorizationRequest);
            
        app.post('/'+this.parent.namespace+'/authorizationRequest/accept', 
            this.parent.options, 
            this.parent.session, 
            OAuthController.acceptAuthorizationRequest);
            
        app.post('/'+this.parent.namespace+'/accessTokenRequest', 
            this.parent.options, 
            this.parent.session, 
            OAuthController.accessTokenRequest);
    }
    Consent.prototype.configure.admin = function(App){
        var app = App ? App : this.parent.app ;
        if(!app) {
            throw new Error('Consent: "admin" directive needs an app. Either provide one with the "app" directive or pass in one with the "admin" directive.');
        } else {
            app.get('/'+this.parent.namespace+'/admin', 
                this.parent.options, 
                AdminController.home);
            
            app.post('/'+this.parent.namespace+'/admin/client/create', 
                this.parent.options, 
                AdminController.createClient);
            
            app.get('/'+this.parent.namespace+'/admin/client/remove/:client_id', 
                this.parent.options, 
                AdminController.deleteClient);
        }
    }
    
    module.exports = Consent

