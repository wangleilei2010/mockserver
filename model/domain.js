/**
 * Created by wll17331 on 2016/8/17.
 */
'use strict'
var mongodb = require('./mongodb');
var DomainRunner = require('../controller/domainRunner'),
    Service = require('./service');

var userSchema = new mongodb.mongoose.Schema({
    user: String,
    name: String,
    port: Number,
    url: String,
    description: String,
    status: {type: String, enum: ['open', 'closed']}
}, {
    collection: 'domains'
});//domains集合

var domainModel = mongodb.mongoose.model('Domain', userSchema);

function Domain(domain) {
    this.user = domain.user;
    this.name = domain.name;
    this.port = domain.port;
    this.description = domain.description;
    this.status = domain.status;
};

Domain.prototype.save = function (callback) {
    var domain = {
        user: this.user,
        name: this.name,
        port: this.port,
        url: 'http://' + getIp() + ':' + this.port,
        description: this.description,
        status: this.status
    }
    var newDomain = new domainModel(domain);

    newDomain.save(function (err, domain) {
        if (err) {
            return callback(err);
        }
        callback(null, domain);
    });
};//保存

Domain.get = function (name, callback) {
    domainModel.findOne({name: name}, function (err, domain) {
        if (err) {
            return callback(err);
        }
        callback(null, domain);
    });
}

Domain.getallbyuser = function (user, callback) {
    domainModel.find({user: user}, function (err, domains) {
        if (err) {
            return callback(err);
        }
        callback(null, domains);
    });
}

Domain.getmaxport = function (callback) {
    domainModel.findOne({}).sort('-port').exec(function (err, domain) {
        if (err) {
            return callback(err);
        }
        callback(null, domain);
    });
}

Domain.setRunners = function (runners) {
    domainModel.find({}, function (err, domains) {
        if (err) {
            console.log(err);
        }
        domains.forEach(function (domain) {
            Service.getallbydomain(domain.name, function (error, services) {
                let runner = new DomainRunner(domain);
                runner.serviceArray = services;
                runners.push(runner);
                runner.restart();
            });
        });
    });
}

Domain.update = function (name, newContent, callback) {
    domainModel.update({name: name}, newContent,
        function (err, numAffected) {
            if (err) {
                return callback(err);
            } else {
                callback(null, numAffected);
            }
        });
}

Domain.delete = function (name) {
    domainModel.find({name: name}).remove().exec();
    Service.getallbydomain(name, function (error, services) {
        if (!error) {
            services.forEach(service=> {
                Service.delete(service.name);
            })
        }
    });
}

function getIp() {
    var os = require('os');
    var interfaces = os.networkInterfaces();
    var IPv4 = '127.0.0.1';
    for (var key in interfaces) {
        interfaces[key].forEach(function (details) {
            console.log(key);
            if (details.family == 'IPv4' && key == '本地连接') {
                IPv4 = details.address;
            }
        });
    }
    return IPv4;
}
module.exports = Domain;
