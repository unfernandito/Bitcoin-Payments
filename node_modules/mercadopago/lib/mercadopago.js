var package = require("../package"),
	request = require ("request"),
	Q = require ("q");

var config = {
	API_BASE_URL: "https://api.mercadolibre.com",
	MIME_JSON: "application/json",
	MIME_FORM: "application/x-www-form-urlencoded"
};

MP = function (clientId, clientSecret) {
	this.__clientId = clientId;
	this.__clientSecret = clientSecret;
	this.__sandbox = false;
};

MP.version = package.version;

MP.prototype.sandboxMode = function (enable) {
	if (enable !== null) {
		this.__sandbox = enable === true;
	}

	return this.__sandbox;
};

MP.prototype.getAccessToken = function () {
	var __self = this;

	var next = typeof (arguments[arguments.length -1]) == "function" ? arguments[arguments.length -1] : null;
	var deferred = Q.defer();

	MP.restClient.post(
		"/oauth/token",
		{
			"client_id": this.__clientId,
			"client_secret": this.__clientSecret,
			"grant_type": "client_credentials"
		},
		config.MIME_FORM
	)
		.then (
			function success (data) {
				deferred.resolve (data.response.access_token);
			},
			function error (err) {
				deferred.reject (err);
			});

	return deferred.promise;
};

/**
Get information for specific payment
@param id
@return json
*/    
MP.prototype.getPayment = MP.prototype.getPaymentInfo = function (id) {
	var next = typeof (arguments[arguments.length -1]) == "function" ? arguments[arguments.length -1] : null;

	var uriPrefix = this.__sandbox ? "/sandbox" : "";

	return this.get (uriPrefix+"/collections/notifications/"+id, next);
};

/**
Get information for specific authorized payment
@param id
@return json
*/    
MP.prototype.getAuthorizedPayment = function (id) {
	var next = typeof (arguments[arguments.length -1]) == "function" ? arguments[arguments.length -1] : null;

	return this.get ("/authorized_payments/"+id, next);
};

/**
Refund accredited payment
@param id
@return json
*/    
MP.prototype.refundPayment = function (id) {
	var next = typeof (arguments[arguments.length -1]) == "function" ? arguments[arguments.length -1] : null;

	return this.put ("/collections/"+id, {"status": "refunded"}, next);
};

/**
Cancel pending payment
@param id
@return json
*/    
MP.prototype.cancelPayment = function (id) {
	var next = typeof (arguments[arguments.length -1]) == "function" ? arguments[arguments.length -1] : null;

	return this.put ("/collections/"+id, {"status": "cancelled"}, next);
};

/**
Cancel preapproval payment
@param id
@return json
*/    
MP.prototype.cancelPreapprovalPayment = function (id) {
	var next = typeof (arguments[arguments.length -1]) == "function" ? arguments[arguments.length -1] : null;

	return this.put ("/preapproval/"+id, {"status": "cancelled"}, next);
};

/**
Search payments according to filters, with pagination
@param filters
@param offset
@param limit
@return json
*/
MP.prototype.searchPayment = function (filters, offset, limit) {
	var next = typeof (arguments[arguments.length -1]) == "function" ? arguments[arguments.length -1] : null;

	if (!isNaN(offset)) {
		filters.offset = offset;
	}
	if (!isNaN(limit)) {
		filters.limit = limit;
	}

	var uriPrefix = this.__sandbox ? "/sandbox" : "";

	return this.get (uriPrefix+"/collections/search", filters, next);
};

/**
Create a checkout preference
@param preference
@return json
*/
MP.prototype.createPreference = function (preference){
	var next = typeof (arguments[arguments.length -1]) == "function" ? arguments[arguments.length -1] : null;

	return this.post ("/checkout/preferences", preference, next);
};

/**
Update a checkout preference
@param id
@param preference
@return json
*/
MP.prototype.updatePreference = function (id, preference) {
	var next = typeof (arguments[arguments.length -1]) == "function" ? arguments[arguments.length -1] : null;

	return this.put ("/checkout/preferences/"+id, preference, next);
};

/**
Get a checkout preference
@param id
@param preference
@return json
*/
MP.prototype.getPreference = function (id) {
	var next = typeof (arguments[arguments.length -1]) == "function" ? arguments[arguments.length -1] : null;

	return this.get ("/checkout/preferences/"+id, next);
};

/**
Create a preapproval payment
@param preference
@return json
*/
MP.prototype.createPreapprovalPayment = function (preapprovalPayment){
	var next = typeof (arguments[arguments.length -1]) == "function" ? arguments[arguments.length -1] : null;

	return this.post ("/preapproval", preapprovalPayment)
};

/**
Get a preapproval payment
@param id
@param preference
@return json
*/
MP.prototype.getPreapprovalPayment = function (id) {
	var next = typeof (arguments[arguments.length -1]) == "function" ? arguments[arguments.length -1] : null;

	return this.get ("/preapproval/"+id, next);
};

/* Generic resource call methods */

/**
Generic resource get
@param uri
@param params
@param authenticate = true
*/
MP.prototype.get = function (uri, params, authenticate) {
	var _self = this;

	var next = typeof (arguments[arguments.length -1]) == "function" ? arguments[arguments.length -1] : null;
	var deferred = Q.defer();

	params = params && typeof params == "object" ? params : {};

	if (authenticate !== false) {
		this.getAccessToken ()
			.then (
				function success (accessToken) {
					params.access_token = accessToken;

					if (Object.keys(params).length > 0) {
						uri += (uri.indexOf ("?") >= 0 ? "&" : "?") + _self.__build_query(params);
					}

					MP.restClient.get(uri, config.MIME_JSON)
						.then (
							function success (data) {
								next && next (null, data);
								deferred.resolve (data);
							},
							function error (err) {
								next && next(err);
								deferred.reject(err);
							});
				},
				function error (err) {
					next && next(err);
					deferred.reject(err);
				});
	} else {
		if (Object.keys(params).length > 0) {
			uri += (uri.indexOf ("?") >= 0 ? "&" : "?") + _self.__build_query(params);
		}

		MP.restClient.get(uri, config.MIME_JSON)
			.then (
				function success (data) {
					next && next (null, data);
					deferred.resolve (data);
				},
				function error (err) {
					next && next(err);
					deferred.reject(err);
				});
	}

	return deferred.promise;
};

/**
Generic resource post
@param uri
@param data
@param params
*/
MP.prototype.post = function (uri, data, params) {
	var _self = this;

	var next = typeof (arguments[arguments.length -1]) == "function" ? arguments[arguments.length -1] : null;
	var deferred = Q.defer();

	params = params && typeof params == "object" ? params : {};

	this.getAccessToken ()
		.then (
			function success (accessToken) {
				params.access_token = accessToken;

				if (Object.keys(params).length > 0) {
					uri += (uri.indexOf ("?") >= 0 ? "&" : "?") + _self.__build_query(params);
				}

				MP.restClient.post(uri, data, config.MIME_JSON)
					.then (
						function success (data) {
							next && next (null, data);
							deferred.resolve (data);
						},
						function error (err) {
							next && next(err);
							deferred.reject(err);
						});
			},
			function error (err) {
				next && next(err);
				deferred.reject(err);
			});

	return deferred.promise;
};

/**
Generic resource put
@param uri
@param data
@param params
*/
MP.prototype.put = function (uri, data, params) {
	var _self = this;

	var next = typeof (arguments[arguments.length -1]) == "function" ? arguments[arguments.length -1] : null;
	var deferred = Q.defer();

	params = params && typeof params == "object" ? params : {};

	this.getAccessToken ()
		.then (
			function success (accessToken) {
				params.access_token = accessToken;

				if (Object.keys(params).length > 0) {
					uri += (uri.indexOf ("?") >= 0 ? "&" : "?") + _self.__build_query(params);
				}

				MP.restClient.put(uri, data, config.MIME_JSON)
					.then (
						function success (data) {
							next && next (null, data);
							deferred.resolve (data);
						},
						function error (err) {
							next && next(err);
							deferred.reject(err);
						});
			},
			function error (err) {
				next && next(err);
				deferred.reject(err);
			});

	return deferred.promise;
};

/*************************************************************************/
MP.prototype.__build_query = function (params) {
	var elements = []

	for (var key in params) {
		if (params[key] == null) {
			params[key] = "";
		}

		elements.push(key+"="+escape(params[key]));
	}

	return elements.join("&");
};

MP.restClient = {
	__exec: function (uri, req) {
		var deferred = Q.defer();
		req.uri = config.API_BASE_URL + uri;

		req.headers = {
			"User-Agent": "MercadoPago Node.js SDK v"+MP.version,
			"Accept": config.MIME_JSON
		}

		req.agentOptions = {
			secureProtocol: 'SSLv3_method'
		};

		request(req, function(error, response, body) {
			(typeof body == "string") && (body = JSON.parse(body));

			if (error) {
				deferred.reject (error);
			} else if (response.statusCode < 200 || response.statusCode >= 300) {
				deferred.reject (body);
			} else {
				deferred.resolve ({
					"status": response.statusCode,
					"response": body
				});
			}
		});

		return deferred.promise;
	},

	get: function (uri, contentType) {
		var req = {
			"method": "GET"
		}
		contentType == config.MIME_JSON && (req.json = true);

		return this.__exec (uri, req);
	},

	post: function (uri, data, contentType) {
		var req = {
			"method": "POST"
		}

		contentType == config.MIME_JSON && (req.json = data);
		contentType == config.MIME_FORM && (req.form = data);

		return this.__exec (uri, req);
	},

	put: function (uri, data, contentType) {
		var req = {
			"method": "PUT"
		}
		contentType == config.MIME_JSON && (req.json = data);
		contentType == config.MIME_FORM && (req.form = data);

		return this.__exec (uri, req);
	}
};

module.exports = MP;
