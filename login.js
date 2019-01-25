var cookieParser = require('cookie-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var md5 = require('md5');
module.exports = {
    init: function (app) {
        app.use(bodyParser.urlencoded({
            extended: true
        }));
        app.use(cookieParser());
        app.use(session({
            key: 'user_sid',
            secret: 'somerandonstuffs',
            resave: false,
            saveUninitialized: false,
            cookie: {
                expires: 600000
            }
        }));
        app.use((req, res, next) => {
            if (req.cookies.user_sid && !req.session.user) {
                res.clearCookie('user_sid');
            }
            next();
        });
        var sessionChecker = (req, res, next) => {
            if (req.session.user && req.cookies.user_sid) {
                res.redirect('/dashboard');
            } else {
                next();
            }
        };
        app.get('/', sessionChecker, (req, res) => {
            res.redirect('/login');
        });
        app.route('/signup')
            .get(sessionChecker, (req, res) => {
                res.sendFile(__dirname + '/webpage/signup.html');
            })
            .post((req, res) => {
                User.create({
                        username: req.body.username,
                        email: req.body.email,
                        password: req.body.password
                    })
                    .then(user => {
                        req.session.user = user.dataValues;
                        res.redirect('/dashboard');
                    })
                    .catch(error => {
                        res.redirect('/signup');
                    });
            });
        app.route('/login')
            .get(sessionChecker, (req, res) => {
                res.sendFile(__dirname + '/webpage/login.html');
            }).post((req, res) => {
                var username = req.body.username,
                    password = req.body.password;
                password = md5(password);
                bUser = username == "ardhi" ? true : false;
                bPassword = password == md5("ardhi") ? true : false;
                if (!bUser) {
                    res.redirect('/login?auth=0');
                    //res.cookie("auth", "0");
                } else if (!bPassword) {
                    res.redirect('/login?auth=0');
                    //res.cookie("auth", "0");
                } else {
                    req.session.user = "ardhi";
                    res.cookie("username", username);
                    res.redirect('/dashboard');
                }
                /*
                User.findOne({
                    where: {
                        username: username
                    }
                }).then(function (user) {
                    if (!user) {
                        res.redirect('/login');
                    } else if (!user.validPassword(password)) {
                        res.redirect('/login');
                    } else {
                        req.session.user = user.dataValues;
                        res.redirect('/dashboard');
                    }
                });
                */
            });
        app.get('/dashboard', (req, res) => {
            if (req.session.user && req.cookies.user_sid) {
                res.sendFile(__dirname + '/webpage/dashboard.html');
            } else {
                res.redirect('/login');
            }
        });
        app.get('/logout', (req, res) => {
            if (req.session.user && req.cookies.user_sid) {
                res.clearCookie('user_sid');
                res.redirect('/');
            } else {
                res.redirect('/login');
            }
        });
    }

    //etc
}