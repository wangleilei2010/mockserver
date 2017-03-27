/**
 * Created by wll17331 on 2016/8/9.
 */
'use strict'
var Domain = require('../model/domain'),
    DomainRunner = require('./domainRunner');

function ServiceContainer() {
    this.domainRunners = [];
    Domain.setRunners(this.domainRunners);
    //this.domainRunners.forEach(runner=>runner.restart());
}

ServiceContainer.prototype.addDomainRunner = function (domain) {
    var existedRunner = this.findRunner(domain.name);
    if (existedRunner) {
        return existedRunner;
    } else {
        let runner = new DomainRunner(domain);
        this.domainRunners.push(runner);
        runner.restart();
    }
    return getIp() + ":" + domain.port;
};

ServiceContainer.prototype.addService = function (service) {
    var existedRunner = this.findRunner(service.domain);
    if (existedRunner) {
        let originalIndex = findServiceIndex(existedRunner, service);
        if (originalIndex !== -1)
            existedRunner.serviceArray.splice(originalIndex, 1);

        existedRunner.serviceArray.push(service);
        existedRunner.restart();
        return getIp() + ":" + existedRunner.port;
    }
    return null;
};

ServiceContainer.prototype.removeService = function (service) {
    var existedRunner = this.findRunner(service.domain);
    if (existedRunner) {
        var arr = existedRunner.serviceArray;
        let removeIndex = findServiceIndex(existedRunner, service);
        if (removeIndex !== -1) {
            arr.splice(removeIndex, 1);
            existedRunner.restart();
        }
    }
};

ServiceContainer.prototype.findRunner = function (domainName) {
    for (var i = 0; i < this.domainRunners.length; i++) {
        var runner = this.domainRunners[i];
        if (runner.domain === domainName)
            return runner;
    }
    return undefined;
};


function findServiceIndex(domain, service) {
    var serviceArr = domain.serviceArray;
    for (var i = 0; i < serviceArr.length; i++) {
        if (serviceArr[i].url === service.url) {
            return i;
        }
    }
    return -1;
}

function getIp() {
    var os = require('os');
    var interfaces = os.networkInterfaces();
    var IPv4 = '127.0.0.1';
    for (var key in interfaces) {
        interfaces[key].forEach(function (details) {
            if (details.family == 'IPv4' && key == '本地连接') {
                IPv4 = details.address;
            }
        });
    }
    return IPv4;
}

module.exports = ServiceContainer;
