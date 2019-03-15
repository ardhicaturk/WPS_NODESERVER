var cookieParser = require('cookie-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var Sequelize = require('sequelize');
// var sequelize = new Sequelize('postgres://postgres:postgres@localhost:5432/auth-system', {
//     logging: false
// });
// var hs ='postgres://postgres:postgres@localhost:5432/auth-system';
// var sequelize = new Sequelize(process.env.DATABASE_URL || hs, {
//     logging: false
// });
var hs = 'postgres://zjczluqbvhxxsh:090ac543674f2e44c99c8835073d324b7f05586928317f336fbe630732bf09a6@ec2-107-22-238-186.compute-1.amazonaws.com:5432/d8lre5n7ki3ob1';
var sequelize = new Sequelize(process.env.DATABASE_URL || hs, {
    logging: false,
    dialect: 'postgres',
    dialectOptions: {
        ssl: true
    }
});
var md5 = require('md5');

var usr = sequelize.define('users', {
    username: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    },
    nama: {
        type: Sequelize.STRING,
        allowNull: false
    },
    alamat: {
        type: Sequelize.STRING,
        allowNull: false
    },
    nomorhp: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

function checkNodeInUser(username) {
    var model = newUser(username);
    var buf = 0;
    try {
        model.sync()
            .then(() => {
                model.findAll().then((user) => {
                    var a = user.length == undefined ? 0 : user.length;
                    console.log("Jumlah node terdaftar " + username + ": " + a);
                    buf = a;
                });
            })
            .catch((error) => {
                console.log(username + " belum memiliki node: " + error);
                buf = 0;
            });
    } catch (e) {
        console.log(e);
    }

    return buf;
}

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

function newUser(username) {
    var modelUser = sequelize.define(username, {
        SID: {
            type: Sequelize.STRING,
            unique: true,
            allowNull: false
        },
        nameNode: {
            type: Sequelize.STRING,
            allowNull: false
        },
        keterangan: {
            type: Sequelize.STRING,
            allowNull: false
        }
    });
    return modelUser;
}
module.exports = {
    modelUser: function () {
        return usr;
    },
    Opt: function(){
        return Sequelize.Op;
    },
    modelData2: function(nodeName){
        var nondeModel = sequelize.define(nodeName, {
            time: {
                type: Sequelize.DATE,
                unique: false,
                allowNull: false
            },
            tegangan: {
                type: Sequelize.FLOAT,
                unique: false,
                allowNull: false
            },
            arus: {
                type: Sequelize.FLOAT,
                unique: false,
                allowNull: false
            },
            suhuEnv: {
                type: Sequelize.FLOAT,
                unique: false,
                allowNull: false
            },
            suhuLine: {
                type: Sequelize.FLOAT,
                unique: false,
                allowNull: false
            },
            kondisi: {
                type: Sequelize.TEXT,
                unique: false,
                allowNull: false
            },
            kondisiSSR: {
                type: Sequelize.INTEGER,
                unique: false,
                allowNull: false
            }
        });
        return nondeModel;
    },
    modelData: function(nodeName){
        var nondeModel = sequelize.define(nodeName, {
            time: {
                type: Sequelize.INTEGER,
                unique: false,
                allowNull: false
            },
            tegangan: {
                type: Sequelize.FLOAT,
                unique: false,
                allowNull: false
            },
            arus: {
                type: Sequelize.FLOAT,
                unique: false,
                allowNull: false
            },
            suhuEnv: {
                type: Sequelize.FLOAT,
                unique: false,
                allowNull: false
            },
            suhuLine: {
                type: Sequelize.FLOAT,
                unique: false,
                allowNull: false
            },
            kondisi: {
                type: Sequelize.TEXT,
                unique: false,
                allowNull: false
            },
            kondisiSSR: {
                type: Sequelize.INTEGER,
                unique: false,
                allowNull: false
            }
        });
        return nondeModel;
    },
    modelNode: function(nodeName){
        var nondeModel = sequelize.define(nodeName, {
            time: {
                type: Sequelize.TEXT,
                unique: false,
                allowNull: false
            },
            tegangan: {
                type: Sequelize.TEXT,
                unique: false,
                allowNull: false
            },
            arus: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            suhuEnv: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            suhuLine: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            kondisi: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            kondisiSSR: {
                type: Sequelize.TEXT,
                allowNull: false
            }
        });
        return nondeModel;
    },
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
                var model = newUser(req.cookies.username);
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
            createNewNode(newUser(req.cookies.username), SID, namaNode, ket);
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
    },
    authdb: function () {
        return sequelize;
    },
    getNode: function (username) {
        var modul = newUser(username);
        return modul;
    }
    //etc
}
