
# Consent

Fast, lightweight, customizable [RFC 6749](https://tools.ietf.org/html/rfc6749) compliant\* [OAuth2](http://oauth.net/2/) server. Runs on [diet](http://dietjs.com/). Stores clients, grants and tokens with [mongodb](https://www.mongodb.org/).

```javascript
var app = require('diet')().listen(7000)

var consent = require('consent')()
	consent('app', app)
	consent('database', 'mongodb://localhost:27017/oauth')
	consent('session', sessionHandler)
	consent('dialog', dialogHandler)

```

![enter image description here](http://i.imgur.com/Q8TuwOJ.png)

## Table of Contents:

 1. Features
 2. Prerequisites
 3. Install
 4. Usage
	 1. How to initialize
	 2. Directives
 5. Authorization Protocol Flow
 6. OAuth Definitions
 6. Authorization Request Example
 7. OAuth Endpoints
	 1. GET /oauth/authorizationRequest
	 2. POST /oauth/accessTokenRequest
 8. Consent Dialog API
 9. Database Models
 10. Dialog Data
 12. Guidelines for Dialog Screen Designers
 13. Experimental: Admin Endpoints
 13. Todos
 14. Contribution
 15. License

## Features:
- \*Support for **Authorization Code** Grant (1/4 of grants - the other's coming later)
- Integrates into Diet.js allowing to automatically convert every Session Protected Route into OAuth API's
- MongoDB to store Grants, Tokens and Clients
- New optional non-standard return type `pushMessage` to support OAuth in browser extensions
- New non-standard ISO Date `expire_time` response for Access Tokens for easier expiry check on the Client's side.
- OAuth Admin Panel (for development only!)
 

## Prerequisites
- [MongoDB](https://www.mongodb.org/) - Key Store Database
- [Node.js](https://nodejs.org) - JavaScript runtime engine
- [Diet.js](http://dietjs.com/) - Node.js framework

## Install 
```
npm install consent
```

## Usage

### **How to initialize**
```javascript
// require the module
var Consent = require('consent')

// create a new instance
var consent = new Consent()

// set app directive to a diet server instance
consent('app', app)

// set mongodb address
consent('database', 'mongodb://localhost:27017/oauth')

// set a session handler function
consent('session', sessionHandler)
    
// set a dialog handler function
consent('dialog', dialogHandler)
```

### **Directives**
Consent can be configured by calling it as a function. The first argument is a configuration `directive`. The second is the `value`.

> consent(*directive*, *value*)


#### **app**
Set the Authorization Routes for this Diet Server Instance  
> consent(***"app"***,  diet object ***app***)

#### **admin**
Enable the admin routes.
> consent(***"admin"***, diet object ***app***)

#### **database**
Set the MongoDB Address
> consent(***"database"***, string ***mongoAddress***)

#### **session**
Set the Session Handler. 
> consent(***"session"***, diet route function ***sessionHandler($)***)

#### **dialog**
Set the Dialog Handler. 
> consent(***"dialog"***, diet route function ***dialogHandler($)***)

#### **log**
Enable logging. 
> consent(***"log"***)



## Authorization Protocol Flow
The image below illustrates the steps in the [OAuth2 Protocol Flow](https://tools.ietf.org/html/rfc6749#section-1.2) from A to F:

![Protocol Flow](http://i.imgur.com/4eAzc9U.png)


## OAuth Definitions
Definetely read this if you are a **newbie** to OAuth and want to implement an Authorization Server. 

#### **Involved Parties:**
 - **Client**: A third-party application that connects to the Authorization Server (`ex: twitpic`) to request Resources managed by the Resource Server (`ex: twitter`)
 - **Resource Owner**: The end-user (`ex: john doe`)
 - **Resource Server**: The Server that controls the Resource Owner's resources. It can be the same as the Authorization Server. (`ex: a node.js app`)
 - **Authorization Server**: The authentication service between the Client and the Resource Server. (this is `diet-oauth-server`)

#### **Authorization Server:**
 - **Authorization Request**: The API Endpoint that opens a dialog.
 - **Authorization Grant**: A *credential* representing the resource
   owner's authorization. There are 4 grant types, the "Authorization Code" is one of them.

#### **Authorization Server Responses**:
These are all very sensitive private information. They should never be shared publicly.

##### **Authorization Code**
 A *grant* to request an Access Token. 
```json
{ "code": "123...456=" }
```
#####  **Access Token**
A key to request Resources from the Resource Server on behalf of the Resource Owner. This expires after time upon which a new access token has to be issued by the Authorization Server to the Client. 
```javascript
{ 
	"access_token": "123...456=",
	"expires_in": 3600 ,
	"expire_time": "2015-10-19T20:01:24.218Z" // non-standard
}
```
 
##### **Refresh Token**
A key given by the Resource Owner to be used to request new Access Tokens without the consent of the Resource Owner. It is given along with Access Token Request.
```javascript
{ 
	"refresh_token": "456...789=", 
	"access_token": "123...abc=",
	"expires_in": 3600,
	"expire_time": "2015-10-19T20:01:24.218Z" // non-standard
}
```
 
##### **Protected Resource:**
Information (database entries, files etc.) stored on the Resource Server. Clients (Third-party applications) can only access protected resources with a valid Access Token. 


## Authorization Request Example

#### Server
You'll need a diet server instance and some other configuration like the mongodb address, a session & dialog handler.
```javascript
// Create a Diet Server Instance
var app = require('diet')()
app.listen('http://localhost:7000')
// ...
     
// Create Diet OAuth Server
var consent = require('consent')();
	consent('app', app)
	consent('database', 'mongodb://localhost:27017/oauth')
	consent('session', sessionHandler)
	consent('dialog', dialogHandler)
	

function sessionHandler($){
	// find user based on "HTTP Cookies"
	if($.cookies.id){
	    // ...
		$.return();
	
	// find user based on the "Authorization" Header	
	} else if($.header('Authorization')) {
		oauth.requestAccess($, function(error, token){
               if(token){
                // ... find user with token.user_id ...
                $.return()
               } else {
                // handle failure 
                   $.return();
               }
           });
	
	// can't find the user
	} else {
		$.return();
		
	}
}

function dialogHandler($){
	// display the OAuth Consent Dialog. By default $.data.page is already set to "oauth_dialog" that can be used in html templates for example
	$.end('<html>...</html>'); 
}
```

#### **Client: Use the API Endpoints**
The default `namespace` is `oauth`. You can change that with the `namespace` directive.
```haml
// template
https://{domain}/{oauth namespace}/{api endpoint}
```
```haml
// example
https://example.com/oauth/authorizationRequest
```

#### **Example Request:**
##### **Client: Authorization Request:**
The following URL (API Endpoint) opens a dialog between the User and Client through our Diet OAuth Server. 
```
// open the dialog
curl http://localhost:7000/oauth/authorizationRequest
```

##### **Server: Respond with An HTML Dialog Screen**
The `oauth/authorizationRequest` API Endpoint will return whatever was sent back in the **Dialog Handler** function. Consent does not provide any templates, it is the implementer's job to construct a dialog respond for the authorization request.  

###### **Ex: Logged In User**
```html
<!-- show which client is requesting the access -->
<h1>{{-this.client.name}} would like to:</h1>

<!-- display the scopes -->
<ul>
	<li>Basic User Information</li>
	{{if this.scope.indexOf('resource') == -1 :}}
		<li>View, edit, delete your resources.</li>
	{{end}}
</ul>

<!-- let the end-user decide -->
<form action="{{-this.oauth_accept}}" method="post">
	<button type="submit" id="oauth-accept">Accept</button>
	<button onclick="window.close();">Not now</button>
</form>
```

###### **Ex: Logged Out User**
```html
<h1>Please login to give access to {{-this.client.name}}</h1>
<form action="/user/login" method="post">
	<input type="text" name="username" placeholder="Username"/>
	<input type="text" name="password" placeholder="Password"/>
	<input type="submit" />
</form>
```


## OAuth API Endpoints
These are the default API Endpoints used by the Client application to authorize a Resource Owner.

### **GET /oauth/authorizationRequest**

#### **Request: Required query parameters**

- **client_id**- The Client application's ID
- **response_type** - the value should be **code**
- **state** - An opaque value used by the client to maintain
         state between the request and "callback".

#### **Request: Optional query parameters**
- **redirect_uri** - Where to redirect the end-user after successfull authorization? 
- **response_format** - Specify a special response format. For now the only possible option is `pushMessage` which returns an html page with a javascript that sends the code with the HTML5 `pushMessage` to it's opener window. Good for extensions. (non-standard)
- **scope** - Comma separated scope list

#### **Returns: Dialog Handler**
Returns whatever was send back with the `consent('dialog', handler)`


### **GET /oauth/accessTokenRequest**

#### **Request: Required query parameters**
- **client_id**- The Client application's ID
- **code** - An Authorization Code from the Authorization Request. 

#### **Response**
The response is a JSON object. 

- The `refresh_token` is only shown if the `offline_access` scope is found in the Grant. 
- The `expire_time` parameter is a non-standard ISO Date which is the Date/Time version of the expiration. It helps the Client to determine the state of expiration on the access_token.

```javascript
{ 
	"refresh_token": "456...789=", 
	"access_token": "123...abc=",
	"expires_in": 3600,
	"expire_time": "2015-10-19T20:01:24.218Z"
}
```



## Database Models

#### **Access Token**
```javascript
{
    value       : { type: String, required: true },
    user_id     : { type: String, required: true },
    client_id   : { type: String, required: true },
    scope       : { type: Array, default: [] },
    expires_in  : { type: Number, default: 3600 },
    expire_time : { type: Date, required: true },
    createdAt   : { type: Date, required: true }
}
```

#### **Refresh Token**
```javascript
{
    value      : { type: String, required: true },
    user_id    : { type: String, required: true },
    client_id  : { type: String, required: true },
    createdAt  : { type: Date, required: true }
}
```

#### **Grant**
```javascript
{
    code          : { type: String, required: true },
    client_id     : { type: String, required: true },
    user_id       : { type: String, required: true },
    response_type : { type: String },
    scope         : { type: Array, default: [] },
    state         : { type: String },
    redirect_uri  : { type: String },
    used          : { type: Boolean, default: false }
}
```

#### **Client**
```javascript
{
    name             : { type: String, unique: true, required: true },
    client_secret    : { type: String, required: true },
    client_id        : { type: String, required: true },
    callbacks        : { type:  Array, required: true }
}
```

## Dialog Data
When the **Dialog Handler** is called the `$.data`  object can have the following values based on what was sent to the `authorizationRequest` API Endpoint :


| Data     | Value Type | Value  | Extracted From  |
| -------  | ------------| -----| -----|
| $.**data**.**client_id** | Variable String | Client ID | Query String
| $.**data**.**client** | Database Model | `Client` | Database
| $.**data**.**response_type** | Variable String | `code` or `token` | Query String
| $.**data**.**response_format** | Variable String | `pushMessage` | Query String
| $.**data**.**page** | String | `oauth_dialog` | 
| $.**data**.**oauth_redirect** | Variable String | href of the current request | Request URL
| $.**data**.**oauth_accept** | String | Relative URL to the `Authorization Request Accept` API Endpoint with the current Request's Querystring | API + Request URL
| $.**data**.**oauth_decline** | String | Relative URL to the `Authorization Request Decline` API Endpoint including the current Request's Querystring | API + Request URL

## Guidelines for Dialog Screen Designers
In order for the `Resource Owner` to be comfortable giving access to Client applications, the Authorization Server should respond with a Dialog that follows these guidelines:

 - If the Resource Owner is not logged in, a login form should be displayed. Login errors should be displayed in the dialog as well. On successfull login the Resource Owner should redirected to the Authorization Request.
 - Display the required scopes so the Resource Owner knows what permissions he/she gives to the Client application. Not providing details about the permissions could make the owner think it requires permission to everything. Every scope required by the client should be displayed in detail.
 - Provide information about the Resource Owner like name, email or username. This is important since another user could be logged-in with the Resource Server or the Resource Owner might have multiple accounts at the Resource Server.

## Experimental: Admin Endpoints
These are the available routes when `consent('admin')` is set.  **Please note this is only for development! Do not use this in production!**

| Method  | API    | Description   | Request Requirements | Response 
| -------  | ------------| -----| -----| -----|
| GET | /oauth/admin                | display all database informations, create and delete clients | | html
| POST | /oauth/admin/client/create | create new client  | `id` in query | redirects `back`
| POST | /oauth/admin/client/remove | delete client      | `id` in query | redirects `back`

### Todos
- Implement the other 3 Authentication Grants: [Implicit](https://tools.ietf.org/html/rfc6749#section-1.3.2), [Resource Owner Password Credentials](https://tools.ietf.org/html/rfc6749#section-1.3.3) and [Client Credentials](https://tools.ietf.org/html/rfc6749#section-1.3.4).
- Support the complete [RFC Client Registration](https://tools.ietf.org/html/rfc6749#section-2) process
- Create Administrative Accounts for the Admin Panel
- Client and Administrative Authentication for Admin Panel
- Allow any database as storage

## Contributions!
Any contribution to the source code is much appreciated!

## License

(The MIT License)

Copyright (c) 2014 Halász Ádám

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.