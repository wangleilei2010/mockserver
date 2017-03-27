/**
 * Created by wll17331 on 2016/8/17.
 */

var mongodb = require('./mongodb');
var Domain = require('./domain');

var serviceSchema = new mongodb.mongoose.Schema({
    user: String,
    name: String,
    domain: String,
    status_code: Number,
    url: String,
    headers: String,
    resp_body: String,
    status: {type: String, enum: ['open', 'closed']},
    full_url: String
}, {
    collection: 'services'
});//services集合

var serviceModel = mongodb.mongoose.model('Service', serviceSchema);

function Service(service) {
    this.user = service.user;
    this.name = service.name;
    this.domain = service.domain;
    this.status_code = service.status_code;
    this.url = service.url;
    this.headers = service.headers;
    this.resp_body = service.resp_body;
    this.status = service.status;
    this.full_url = service.full_url;
};

Service.prototype.save = function (callback) {
    var service = {
        user: this.user,
        name: this.name,
        domain: this.domain,
        status_code: this.status_code,
        url: this.url,
        headers: this.headers,
        resp_body: this.resp_body,
        status: this.status,
        full_url:this.full_url
    }
    var newService = new serviceModel(service);

    newService.save(function (err, service) {
        if (err) {
            return callback(err);
        }
        callback(null, service);
    });
};

Service.get = function (domain, name, callback) {
    serviceModel.findOne({domain: domain, name: name}, function (err, service) {
        if (err) {
            return callback(err);
        }
        callback(null, service);
    });
}

Service.getallbyuser = function (user, callback) {
    serviceModel.find({user: user}, function (err, services) {
        if (err) {
            return callback(err);
        }
        callback(null, services);
    });
}

Service.getallbydomain = function (domain, callback) {
    serviceModel.find({domain: domain}, function (err, services) {
        if (err) {
            return callback(err);
        }
        callback(null, services);
    });
}

Service.update = function (name, newContent, callback) {
    serviceModel.update({name: name}, newContent, options = {multi: true},
        function (err, numAffected) {
            if (err) {
                return callback(err);
            } else {
                callback(null, numAffected);
            }
        });
}

Service.delete = function (name) {
    serviceModel.find({name: name}).remove().exec();
}

module.exports = Service;
