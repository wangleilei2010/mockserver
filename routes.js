/**
 * Created by wll17331 on 2016/8/17.
 */
'use strict'

var crypto = require('crypto'),
    User = require('./model/user'),
    Domain = require('./model/domain'),
    ServiceContainer = require('./controller/serviceContainer'),
    Service = require('./model/service'),
    http = require("http");

var serviceContainer = new ServiceContainer();

module.exports = function (app) {
    app.post("/service/create", authentication);
    app.post('/service/create', function (req, res) {
        Domain.get(req.body.domain, function (error, domain) {
            if (!error) {
                let status = 'open';
                if (req.query.saveonly) {
                    status = 'closed';
                }
                let service = new Service({
                    user: req.session.user.name,
                    name: req.body.msname,
                    domain: req.body.domain,
                    url: req.body.url,
                    status_code: req.body.status_code,
                    headers: req.body.headers,
                    resp_body: req.body.resp_body,
                    status: status,
                    full_url: domain.url + req.body.url
                });
                let sourceUrl = serviceContainer.addService(service);
                service.save(function (err, service) {
                    if (err) {
                        req.session.error = err;
                        return res.redirect('/newmock');
                    }
                    res.redirect('/home');
                });
            }
        });

        //res.send(sourceUrl + service.url);
    });

    app.post("/domain/create/?$", authentication);
    app.post('/domain/create/?$', function (req, res) {
        let domain = req.body.domain;
        let description = req.body.description;
        let port = req.body.port;

        var newDomain = new Domain({
            user: req.session.user.name,
            name: domain,
            port: port,
            description: description,
            status: 'open'
        });

        serviceContainer.addDomainRunner(newDomain);

        Domain.get(newDomain.name, function (err, domain) {
            if (domain) {
                return res.redirect('/newdomain');
            }

            newDomain.save(function (err, domain) {
                if (err) {
                    req.session.error = err;
                    return res.redirect('/newdomain');
                }
                res.redirect('/domainlist');
            });

        });
    });

    app.use('/service/close/?$', function (req, res) {
        let service = new Service({
            domain: req.query.domain,
            url: req.query.url
        });

        serviceContainer.removeService(service);

        res.send('closed: ' + service.domain + ':' + service.url);
    });

    app.get("/login", notAuthentication);
    app.get("/login", function (req, res) {
        res.render('login', {message: "请登录"});
    });

    app.post("/login", notAuthentication);
    app.post("/login", function (req, res) {
        var name = req.body.username,
            password = req.body.password,
            md5 = crypto.createHash('md5'),
            md5_password = md5.update(password).digest('hex');
        if (name == "" || password == "") {
            req.session.error = "请不要留白！";
            return res.redirect('/login');
        }

        User.get(name, function (err, user) {
            if (!user) {
                req.session.error = "用户不存在！";
                return res.redirect('/login');//用户不存在就跳转回登录
            }
            //检查密码是否一致
            if (user.password != md5_password) {
                req.session.error = "密码错误！";
                return res.redirect('/login');
            }
            //用户名密码都匹配后，将用户信息存入session
            req.session.user = user;
            req.session.success = "登录成功！";
            res.redirect('/home');
        });
    });

    app.get("/register", notAuthentication);
    app.get("/register", function (req, res) {
        res.render('register', {
            message: '请登录'
        });
    });

    app.post("/register", notAuthentication);
    app.post("/register", function (req, res) {
        var name = req.body.username,
            password = req.body.password,
            repassword = req.body['repassword'];
        if (name == "" || password == "" || repassword == "") {
            req.session.error = "请不要留白！";
            return res.redirect('/register');
        }
        if (password != repassword) {
            req.session.error = "两次密码输入不一样";
            return res.redirect('/register');
        }
        //密码的md5值
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            name: name,
            password: password
        });
        User.get(newUser.name, function (err, user) {
            if (user) {
                req.session.error = "用户已经存在!";
                return res.redirect('/register');
            }
            //不存在，则增加新用户
            newUser.save(function (err, user) {
                if (err) {
                    req.session.error = err;
                    return res.redirect('/register');
                }
                req.session.user = user;
                req.session.success = "注册成功！";
                res.redirect('/login');
            });

        });
    });

    app.get("/logout", authentication);
    app.get("/logout", function (req, res) {
        req.session.user = null;
        res.redirect('/login');
    });

    app.get("/", authentication);
    app.get("/", function (req, res) {
        res.render('home', {
            message: '欢迎， ' + req.session.user.name,
            user: req.session.user.name
        });
    });

    app.get("/home", authentication);
    app.get("/home", function (req, res) {
        res.render('home', {
            message: '欢迎， ' + req.session.user.name,
            user: req.session.user.name
        });
    });

    app.get("/newmock", authentication);
    app.get("/newmock", function (req, res) {
        let user = req.session.user.name;
        Domain.getallbyuser(user, function (err, domains) {
            if (domains) {
                res.render('newmock', {
                    message: '欢迎， ' + user,
                    domains: domains.filter(domain=>domain.status === 'open').map(d=>d.name)
                });
            }
        });
    });

    app.get("/domainlist", authentication);
    app.get("/domainlist", function (req, res) {
        res.render('domainlist', {
            message: '欢迎， ' + req.session.user.name,
            user: req.session.user.name
        });
    });

    app.get("/newdomain", authentication);
    app.get("/newdomain", function (req, res) {
        Domain.getmaxport(function (err, domain) {
            res.render('newdomain', {
                message: '欢迎， ' + req.session.user.name,
                port: domain ? domain.port + 1 : 8000
            });
        });
    });

    //app.get("/domains", notAuthentication);
    app.get("/domains", function (req, res) {
        let user = req.query.user;

        Domain.getallbyuser(user, function (err, domains) {
            if (domains) {
                //req.session.error = "用户已经存在!";
                res.json(domains);
            }
        });
    });

    app.put("/service/update", function (req, res) {
        let name = req.query.name;

        let newContent = {
            domain: req.body.domain,
            url: req.body.url,
            headers: req.body.headers,
            resp_body: req.body.resp_body,
            status_code: req.body.status_code
        };

        if (req.body.status) {
            newContent = {
                domain: req.body.domain,
                status: req.body.status
            };
        }

        Service.update(name, newContent,
            function (err, numAffected) {
                if (numAffected) {
                    let runner = serviceContainer.findRunner(req.body.domain.toString());
                    runner.restart();
                }
            });
    });

    app.delete("/service/delete", function (req, res) {
        let name = req.query.name;
        Service.delete(name);
    });

    app.put("/domain/update", function (req, res) {
        let name = req.query.name;
        let status = req.body.status;

        Domain.update(name, {status: status},
            function (err, numAffected) {
                if (numAffected) {
                    let runner = serviceContainer.findRunner(name);
                    if (status === 'open') {
                        runner.restart();
                    }
                    else {
                        runner.close2(null);
                        Service.getallbydomain(name, function (error, services) {
                            if (!error) {
                                services.forEach(service=> {
                                    Service.update(service.name, {status: 'closed'},
                                        function (err, numAffected) {
                                            if (numAffected) {
                                            }
                                        });
                                })
                            }
                        });
                    }
                }
            });
    });

    app.delete("/domain/delete", function (req, res) {
        let name = req.query.name;
        let runner = serviceContainer.findRunner(name);
        runner.close2(function () {
            Domain.delete(name);
        });
    });

    app.get("/services", function (req, res) {
        let user = req.query.user;

        Service.getallbyuser(user, function (err, services) {
            if (services) {
                res.send(services);
            }
        });
    });

//这里是权限控制，通过检测session是否存在，对相关页面进行强制重定向
    function authentication(req, res, next) {
        if (!req.session.user) {
            req.session.error = '请登录';
            return res.redirect('/login');
        }
        next();
    }

    function notAuthentication(req, res, next) {
        if (req.session.user) {
            req.session.error = '已登录';
            return res.redirect('/home');
        }
        next();
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
}