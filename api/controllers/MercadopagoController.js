/**
 * MercadopagoController
 *
 * @description :: Server-side logic for managing mercadopagoes
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var MP = require('mercadopago'),
	mp = new MP("1579052137959810", "JEvzC1ND3ASG9GDwshwZpdyJM2sJ24OS");

module.exports = {
	createPayment: function(req, res){
		var preferences = {
			 "items": [
            {
                "title": "Test",
                "quantity": 1,
                "currency_id": "VEF",
                "unit_price": 10000
            }
        ]
		};
		mp.createPreference(preferences, function(err, preference){
			preference.result.sandbox_init_point;
		});
	}
};

