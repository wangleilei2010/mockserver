/**
 * Created by wll17331 on 2016/8/18.
 */

'use strict'
var express = require("express"),
    http = require("http"),
    Service = require('../model/service');

function DomainRunner(domain) {
    this.domain = domain.name;
    this.port = domain.port;

    this.app = express();
    this.serviceArray = [];
    this.sockets = [];
    this.server = http.createServer(this.app);
    this.status = 'closed';

    var sockets = this.sockets;
    this.server.on("connection", function (socket) {
        sockets.push(socket);
        socket.once("close", function () {
            sockets.splice(sockets.indexOf(socket), 1);
        });
    });
};

DomainRunner.prototype.restart = function () {
    let thisObj = this;
    let promise = new Promise(function (resolve) {
        resolve(thisObj);
    });

    if (this.status !== 'closed') {
        this.close(promise);
    }
    else {
        this.start();
    }
};

DomainRunner.prototype.start = function () {
    this.loadService();
    this.server.listen(this.port);
    this.status = 'active';
};

DomainRunner.prototype.loadService = function () {
    let runner = this;
    Service.getallbydomain(this.domain, function (error, services) {
        runner.serviceArray = services.filter(s=>s.status === 'open');
        if (runner.app._router) {
            runner.app._router.stack.forEach(removeMiddlewares);
        }
        for (let i = 0; i < runner.serviceArray.length; i++) {
            let service = runner.serviceArray[i];

            runner.app.use(service.url, function (request, response) {
                if (service.headers) {
                    var headers = JSON.parse(service.headers);
                    if (headers) {
                        for (var key in headers) {
                            response.setHeader(key, headers[key])
                        }
                    }
                }
                response.writeHead(service.status_code, undefined);
                response.end(service.resp_body);
            });
        }
    });
};

DomainRunner.prototype.close = function (self) {
    this.sockets.forEach(socket => socket.destroy());
    this.server.close(function () {
        if (self) {
            self.then(function (obj) {
                obj.status = 'closed';
                //console.log("close: " + obj.domain);
                obj.start();
            });
        }
    });
}

DomainRunner.prototype.close2 = function (callback) {
    this.sockets.forEach(socket => socket.destroy());
    this.server.close(function () {
        if (callback) {
            callback();
        }
    });
}

function removeMiddlewares(route, i, routes) {
    switch (route.name) {
        case '<anonymous>':
            routes.splice(i, 1);
            //递归
            routes.forEach(removeMiddlewares);
    }
    if (route.route)
        route.route.stack.forEach(removeMiddlewares);
}

module.exports = DomainRunner;