var cookieParser = require('cookie-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var usr = require('./api/db/table').userModel();
var md5 = require('md5');
var utils = require('./api/utils');
function createNewNode(model, SID, nameNode, keterangan) {
    model.create({
            SID: SID,
            nameNode: nameNode,
            keterangan: keterangan
        })
        .then(user => {
            //newUser(username);
            return 1;
        })
        .catch(error => {
            return 0;
        });
}
module.exports = (app) => {
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
    //=================================== sign up event ===============================//
    app.route('/signup')
        .get(sessionChecker, (req, res) => {
            res.sendFile(__dirname + '/webpage/signup.html');
        })
        .post((req, res) => {
            usr.create({
                    username: req.body.username,
                    email: req.body.email,
                    password: md5(req.body.password),
                    nama: req.body.nama,
                    alamat: req.body.alamat,
                    nomorhp: req.body.nomorhp,
                })
                .then(user => {
                    //newUser(username);
                    res.redirect('/login?auth=1');
                })
                .catch(error => {
                    //console.log(error);
                    res.redirect('/signup?auth=1');
                });

        });
    //=================================== sign in event ===============================//
    app.route('/login')
        .get(sessionChecker, (req, res) => {
            res.sendFile(__dirname + '/webpage/login.html');
        }).post((req, res) => {
            var username = req.body.username,
                password = req.body.password;
            password = md5(password);
            usr.findOne({
                where: {
                    username: username
                }
            }).then(function (user) {
                console.log("comp: " + password + " & " + user.get('password'));
                var comp = password == user.get('password') ? true : false;
                if (!user) {
                    res.redirect('/login?auth=0');
                } else if (!comp) {
                    res.redirect('/login?auth=0');
                } else {
                    req.session.user = user.dataValues;
                    res.cookie("username", username);
                    res.redirect('/dashboard');
                }
            }).catch(error => {
                res.redirect('/login?auth=2');
            });

        });

    //=================================== dashboard event ===============================//
    app.get('/dashboard', (req, res) => {
        if (req.session.user && req.cookies.user_sid) {
            res.sendFile(__dirname + '/webpage/dashboard.html');
        } else {
            res.redirect('/login');
        }
    });
    //=================================== logout event ====================================//
    app.get('/logout', (req, res) => {
        if (req.session.user && req.cookies.user_sid) {
            res.clearCookie('user_sid');
            res.redirect('/');
        } else {
            res.redirect('/login');
        }
    });

    //=================================== daftar node event ================================//
    app.route('/daftarnode').get((req, res) => {
        if (req.session.user && req.cookies.user_sid) {
            var model = utils.getNode(req.cookies.username);
            try {
                model.sync()
                    .then(() => {
                        model.findAll().then((user) => {
                            var a = user.length == undefined ? 0 : user.length;
                            console.log("Jumlah node terdaftar " + req.cookies.username + ": " + a);

                            res.sendFile(__dirname + '/webpage/daftarnode.html');
                            res.cookie("node", a);
                        });
                    })
                    .catch((error) => {
                        console.log(req.cookies.username + " belum memiliki node: " + error);

                        res.sendFile(__dirname + '/webpage/daftarnode.html');
                        res.cookie("node", 0);
                    });
            } catch (e) {
                console.log(e);
            }
        } else {
            res.redirect('/login');
        }
    }).post((req, res) => {
        var SID = req.body.sid,
            namaNode = req.body.namanode,
            ket = req.body.keterangan;
        createNewNode(utils.getNode(req.cookies.username), SID, namaNode, ket);
        res.redirect('/daftarnode');
    });
    //==================================== datalog event ====================================//
    app.get('/data', (req, res) => {
        if (req.session.user && req.cookies.user_sid) {
            res.sendFile(__dirname + '/webpage/data.html');
        } else {
            res.redirect('/login');
        }
    });

}