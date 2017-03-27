/**
 * Created by wll17331 on 2016/8/8.
 */

'use strict'
var express = require("express");
var http = require("http");

class Domain {
    constructor(id, port) {
        this.id = id;
        this.port = port;

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
    }

    addService(service) {
        this.serviceArray.push(service);
    }

    removeService(service) {
        this.serviceArray.remove(service);
    }

    restart() {
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
    }

    start() {
        this.loadService();
        this.server.listen(this.port);
        this.status = 'active';
    }

    loadService() {
        if (this.app._router) {
            this.app._router.stack.forEach(removeMiddlewares);
        }
        for (let i = 0; i < this.serviceArray.length; i++) {
            let service = this.serviceArray[i];

            this.app.use(service.url, function (request, response) {
                response.writeHead(service.status_code, service.headers);
                response.end(service.resp_body);
            });
        }
    }

    close(promise) {
        this.sockets.forEach(socket => socket.destroy());
        this.server.close(function () {
            promise.then(function (obj) {
                obj.status = 'closed';
                console.log("close: " + obj.id);
                obj.start();
            })
        });
    }
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

module.exports = Domain;
