/**
 * Created by wll17331 on 2016/8/15.
 */
'use strict'
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var Domain = require('../controller/Domain');

var url = 'mongodb://localhost:27017/test';

module.exports.insert = function (domain) {
    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        db.collection('domains').insertOne({
            domain_id: domain.id,
            port: domain.port,
            service_array: domain.serviceArray
        });
    });
}

module.exports.update = function (domain) {
    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        db.collection('domains').update({"domain_id": domain.id}, {
            $set: {
                "port": domain.port,
                "service_array": domain.serviceArray
            }
        })
    });
}

module.exports.getDomains = function (domains) {
    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        var cursor = db.collection('domains').find();
        cursor.each(function (err, doc) {
            assert.equal(err, null);
            if (doc != null) {
                let domain = new Domain(doc.domain_id, doc.port);
                domain.serviceArray = doc.service_array;
                domains.push(domain);
                global.initPort = doc.port + 1;
                domain.restart();
            }
        });
    });
}
