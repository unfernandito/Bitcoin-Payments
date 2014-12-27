var MP      = require("../lib/mercadopago"),
    vows    = require("vows"),
    assert  = require("assert"),
    events  = require("events");

var credentials = {
    clientId: "CLIENT_ID",
    clientSecret: "CLIENT_SECRET"
};

var preference = {
  "items": [
    {
      "title": "sdk-nodejs",
      "quantity": 1,
      "currency_id": "ARS",
      "unit_price": 10.5
    }
  ]
};

vows
    .describe("mercadopago")
    .addBatch({
        "Create Preference": {
            topic: function () {
                var _self = this;

                var mp = new MP(credentials.clientId, credentials.clientSecret);
                mp.createPreference(preference, _self.callback);
            },
            "status 201": function (err, resp) {
                assert.isNull(err);

                assert.equal(resp.status, 201);
            },
            "preference data": function (err, resp) {
                assert.isNull(err);

                assert.equal(resp.response.items[0].title, "sdk-nodejs");
                assert.equal(resp.response.items[0].quantity, 1);
                assert.equal(resp.response.items[0].unit_price, 10.5);
                assert.equal(resp.response.items[0].currency_id, "ARS");
            }
        },
        "Get Preference": {
            topic: function () {
                var _self = this;

                var mp = new MP(credentials.clientId, credentials.clientSecret);
                mp.createPreference(preference, function (err, resp) {
                    mp.getPreference(resp.response.id, _self.callback);
                });
            },
            "status 200": function (err, resp) {
                assert.equal(resp.status, 200);
            }
        },
        "Update Preference": {
            topic: function () {
                var _self = this;

                var mp = new MP(credentials.clientId, credentials.clientSecret);

                var preference = {
                  "items": [
                    {
                      "title": "test2",
                      "quantity": 1,
                      "currency_id": "ARS",
                      "unit_price": 20.55
                    }
                  ]
                };

                mp.createPreference(preference, function(err, data){
                    assert.isNull(err);

                    var mp = new MP(credentials.clientId, credentials.clientSecret);

                    var preference = {
                      "items": [
                        {
                          "title": "test2Modified",
                          "quantity": 2,
                          "currency_id": "USD",
                          "unit_price": 100
                        }
                      ]
                    };

                    var preferenceId = data.response.id;

                    mp.updatePreference (preferenceId, preference, function(err, data){
                        assert.isNull(err);

                        var updateStatus = data.status;

                        var mp = new MP(credentials.clientId, credentials.clientSecret);

                        mp.getPreference(preferenceId, function(err, data){
                            data.updateStatus = updateStatus;

                            _self.callback(err, data);
                        });
                    });
                });
            },
            "status 200": function (err, resp) {
                assert.isNull(err);

                assert.equal(resp.updateStatus, 200);
            },
            "preference data": function (err, resp) {
                assert.isNull(err);

                assert.equal(resp.response.items[0].title, "test2Modified");
                assert.equal(resp.response.items[0].quantity, 2);
                assert.equal(resp.response.items[0].unit_price, 100);
                assert.equal(resp.response.items[0].currency_id, "USD");
            }
        }
    }).run();
