const app = require('express')();
var port = process.env.PORT || 8089;
const http = require('http').Server(app);
const io = require('socket.io')(http);
var sslRedirect = require('heroku-ssl-redirect');
//const redis = require('socket.io-redis');
var loginPage = require('./login');
var User = require('./login').modelUser();
//===================================== HTTP Event Handler ========================================//
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    sslRedirect();
    next();
});
/*
app.get('/', function (req, res, next) {
    res.status(200).sendFile(__dirname + '/webpage/index.html');;
});
*/
loginPage.init(app);
app.get('/socket', function (req, res, next) {
    res.status(200).sendFile(__dirname + '/webpage/socket.html');
});
app.get('/datalog', function (req, res, next) {
    res.status(200).sendFile(__dirname + '/webpage/datalog.html');
});
app.get('/js/socket.io.js', function (req, res, next) {
    res.status(200).sendFile(__dirname + '/webpage/js/socket.io.js');
});
app.get('/js/jquery-3.1.1.js', function (req, res, next) {
    res.status(200).sendFile(__dirname + '/webpage/js/jquery-3.1.1.js');
});
app.get('/css/bootstrap.min.css', function (req, res, next) {
    res.status(200).sendFile(__dirname + '/node_modules/bootstrap/dist/css/bootstrap.min.css');
});
app.get('/js/bootstrap.min.js', function (req, res, next) {
    res.status(200).sendFile(__dirname + '/node_modules/bootstrap/dist/js/bootstrap.min.js');
});
//====================================== Socket IO Event Handler ====================================//
var nodeList = new Object();
nodeList.ID = new Array();
nodeList.name = new Array();
nodeList.RSSI = new Array();
nodeList.SID = new Array();
nodeList.kondisiSSR = new Array();
nodeList.tegangan = new Array();
nodeList.arus = new Array();
nodeList.kondisi = new Array();
nodeList.sakelar = new Array();
nodeList.suhuEnv = new Array();
nodeList.suhuLine = new Array();
nodeList.time = new Array();

/*
Additional nodeList:
-kondisiSSR
-RSSI
-Tegangan
-Arus
-Sakelar
-Kondisi
-suhuEnv
-suhuLine
-time
*/
var clientList = new Object();
clientList.user = new Array();
clientList.ID = new Array();
clientList.node = new Array();
clientList.totalPacket = new Array();
/*
var a = {SID: "val", nodeName: "val"};
node.push(a)
#clientList.node struktur
node
-SID
-nodeName

*/
var inChange = false;
async function checkMember(ids, SID, names) {
    var a = nodeList.SID.indexOf(SID);
    if (a > -1) {
        inChange = true;
        if (nodeList.ID[a] != 0) {
            io.sockets.connected[nodeList.ID[a]].disconnect(true);
        }
        nodeList.ID[a] = ids;
        console.log(names + " is connected");
    } else {
        console.log(names + " is connected");
        nodeList.SID.push(SID);
        nodeList.name.push(names);
        nodeList.ID.push(ids);
        nodeList.RSSI.push(0);

    }
}

function translateRSSI(num) {
    if (num >= -30) {
        return "Amazing";
    } else if (num >= -70) {
        return "Good";
    } else if (num >= -90) {
        return "Bad";
    } else {
        return "Poor";
    }
}

function saveInput(dataType, SID, dta) {
    var buf = nodeList.name.indexOf(SID);
    if (buf > -1) {
        switch (dataType) {
            case "RSSI":
                nodeList.RSSI[buf] = dta;
                //console.log("RSSI " + nodeList.name[buf] + ": " + translateRSSI(nodeList.RSSI[buf]));
                break;
            case "param1":
                break;
            default:
                break;
        }
    }

}
io.on('connection', function (socket) {
    //console.log('a user connected: ' + socket.id);
    //socket.send("Your ID: " + socket.id);
    io.sockets.connected[socket.id].emit("ID", socket.id);
    socket.on('disconnect', function () {
        var a = nodeList.ID.indexOf(socket.id);
        if (a > -1) {
            console.log(nodeList.name[a] + ' is disconnected');
            nodeList.ID[a] = 0;
        } else {
            var b = clientList.ID.indexOf(socket.id);
            console.log('web client: ' + clientList.user[b] + ' is disconnected');
        }

    });
    socket.on('greeting', function (data) {
        console.log(data);
    });
    //========================================== NODE HANDLER ======================================//
    socket.on('nameNode', function (data) {
        var a = data.split(","); // 0: name, 1: ID, 2: SID
        var i = -1;
        var z = -1;
        for (var k = 0; k < clientList.node.length; k++) {
            i = clientList.node[k].nameNode.indexOf(a[2]);
            if (i > -1) {
                z = k;
            }
        }
        var name;
        if (i > -1) {
            name = clientList.node[z].nameNode[i];
        } else {
            name = a[0];
        }
        checkMember(a[1], a[2], name);
    });
    socket.on('RSSI', function (data) {
        var a = data.split(","); // 0: SID, 1: RSSI
        saveInput("RSSI", a[0], a[1]);
        //console.log(data);
    });

    socket.on('nodeDataTegangan', function (data) {
        var a = JSON.parse(data);
        var i = nodeList.ID.indexOf(socket.id);
        //console.log("data baru (tegangan): " + nodeList.SID[i]);
        nodeList.tegangan[i] = new Array();
        nodeList.tegangan[i].push(a);
        //console.log(nodeList.tegangan[i]);
    });
    socket.on('nodeDataArus', function (data) {
        var a = JSON.parse(data);
        var i = nodeList.ID.indexOf(socket.id);
        //console.log("data baru (Arus): " + nodeList.SID[i]);
        nodeList.arus[i] = new Array();
        nodeList.arus[i].push(a);
        //console.log(nodeList.arus[i]);
    });
    socket.on('nodeDataSuhuEnv', function (data) {
        var a = JSON.parse(data);
        var i = nodeList.ID.indexOf(socket.id);
        //console.log("data baru (suhuEnv): " + nodeList.SID[i]);
        nodeList.suhuEnv[i] = new Array();
        nodeList.suhuEnv[i].push(a);
        //console.log(nodeList.suhuEnv[i]);
    });
    socket.on('nodeDataSuhuLine', function (data) {
        var a = JSON.parse(data);
        var i = nodeList.ID.indexOf(socket.id);
        //console.log("data baru (suhuLine): " + nodeList.SID[i]);
        nodeList.suhuLine[i] = new Array();
        nodeList.suhuLine[i].push(a);
        //console.log(nodeList.suhuLine[i]);
    });
    socket.on('nodeDataKondisi', function (data) {
        var a = JSON.parse(data);
        var i = nodeList.ID.indexOf(socket.id);
        //console.log("data baru (kondisi): " + nodeList.SID[i]);
        nodeList.kondisi[i] = new Array();
        nodeList.kondisi[i].push(a);
        //console.log(nodeList.suhuLine[i]);
    });
    socket.on('nodeDataKondisiSSR', function (data) {
        var a = JSON.parse(data);
        var i = nodeList.ID.indexOf(socket.id);
        //console.log("data baru (kondisiSSR): " + nodeList.SID[i]);
        nodeList.kondisiSSR[i] = new Array();
        nodeList.kondisiSSR[i].push(a);
        //console.log(nodeList.suhuLine[i]);
    });
    socket.on('nodeDataTime', function (data) {
        var a = JSON.parse(data);
        var i = nodeList.ID.indexOf(socket.id);
        //console.log("data baru (Time): " + nodeList.SID[i]);
        nodeList.time[i] = new Array();
        nodeList.time[i].push(a);
        //console.log(nodeList.suhuLine[i]);
    });
    socket.on("nodeData", function (data) {
        if (data == 'end') {
            var i = nodeList.ID.indexOf(socket.id);
            console.log("Finish transaction: " + nodeList.SID[i]);
            var model = loginPage.modelNode(nodeList.SID[i]);
            model.sync()
                .then(() => {
                    console.log(nodeList.SID[i] + " Sync OK");
                    model.create({
                            time: JSON.stringify(nodeList.time[i]),
                            tegangan: JSON.stringify(nodeList.tegangan[i]),
                            arus: JSON.stringify(nodeList.arus[i]),
                            suhuEnv: JSON.stringify(nodeList.suhuEnv[i]),
                            suhuLine: JSON.stringify(nodeList.suhuLine[i]),
                            kondisi: JSON.stringify(nodeList.kondisi[i]),
                            kondisiSSR: JSON.stringify(nodeList.kondisiSSR[i])
                        })
                        .then(user => {
                            console.log(nodeList.SID[i] + " INSERT OK");
                        })
                        .catch(error => {
                            console.log(nodeList.SID[i] + " INSERT ERROR");
                        });
                })
                .catch(error => console.log(nodeList.SID[i] + ' Sync ERROR', error));
        }
    });
    //=========================================== Webclient Handler =================================//
   
    socket.on("readNodeLastData", function (data) {
        var spl = data.split(","); //0: username, 1: nodename
        var i = clientList.user.indexOf(spl[0]);
        var nn = clientList.node[i].nameNode.indexOf(spl[1]);
        
        console.log(clientList.node[i].SID[nn]);
        var model = loginPage.modelNode(clientList.node[i].SID[nn]);
        model.findAll({
            limit: 1,
            order: [
                ['createdAt', 'DESC']
            ]
        }).then(function (d) {
            var teg = JSON.parse(d[0].get('tegangan'));
            var ars = JSON.parse(d[0].get('arus'));
            var suhuEnv = JSON.parse(d[0].get('suhuEnv'));
            var suhuLine = JSON.parse(d[0].get('suhuLine'));
            var kondisi = JSON.parse(d[0].get('kondisi'));
            var kondisiSSR = JSON.parse(d[0].get('kondisiSSR'));
            var bconnect=nodeList.SID.indexOf(clientList.node[i].SID[nn]);
            var z = [nn,teg[0][teg[0].length - 1], 
            ars[0][ars[0].length - 1],
            suhuEnv[0][suhuEnv[0].length - 1],
            suhuLine[0][suhuLine[0].length - 1],
            kondisi[0][kondisi[0].length - 1],
            kondisiSSR[0][kondisiSSR[0].length - 1],
            bconnect
            ];
            console.log(z);
            io.sockets.connected[socket.id].emit("LastData", z);
        }).catch(e => {
            // console.log(e);
        });

    });

    socket.on('datalogRequest', function (data) {
        var split = data.split(','); //0: namenode , 1: page, 2: username
        var ip = clientList.user.indexOf(split[2]);
        var i = clientList.node[ip].nameNode.indexOf(split[0]);
        console.log("Datalog reqeust: " + clientList.node[ip].SID[i]);
        var model = loginPage.modelNode(clientList.node[ip].SID[i]);
        model.findAll().then(datas => {
            console.log("Datalog size: " + datas.length + " packet");
            var check = JSON.stringify(datas[split[1]]);
            var tes = JSON.parse(check);
            io.sockets.connected[socket.id].emit("datalogResponse", tes);
        });
    });
    socket.on('maxPage', function (data) {
        var a = data.split(','); //0: username, 1: namenode
        var ip = clientList.user.indexOf(a[0]);
        var i = clientList.node[ip].nameNode.indexOf(a[1]);
        var model = loginPage.modelNode(clientList.node[ip].SID[i]);
        model.findAll().then(datas => {
            console.log("max page: " + datas.length + " page");
            io.sockets.connected[socket.id].emit("maxPageResponse", datas.length);
        });
    });
    socket.on('webClient', function (data) {
        var a = data.split(",") // 0: username, 1: ID
        console.log('web client: ' + a[0] + " is connected!");
        var b = clientList.user.indexOf(a[0]);
        if (b > -1) {
            clientList.ID[b] = a[1];
        } else {
            clientList.ID.push(a[1]);
            clientList.user.push(a[0]);
            clientList.totalPacket.push(0);
        }
    });

    socket.on("getNode", function (data) {
        var modul = loginPage.getNode(data);
        modul.sync()
            .then(() => {
                //console.log('sync ok');
                modul.findAll().then(users => {
                    //console.log("maman : " + JSON.stringify(users) + " \n" + users[0].SID);
                    var index = clientList.user.indexOf(data);
                    //console.log("ID CLIENT: " + clientList.user[index]);
                    if (index > -1) {
                        io.sockets.connected[clientList.ID[index]].emit("responseGetNode", users);
                    }
                    for (var i = 0; i < users.length; i++) {
                        var b = 0;
                        try {
                            b = clientList.node[index].SID.indexOf(users[i].SID);
                            // clientList.node[index].SID[b] = users[i].SID;
                            // clientList.node[index].nameNode[b] = users[i].nameNode;
                        } catch (e) {
                            b = -2;
                        }

                        if (b == -2) {
                            clientList.node[index] = new Object();
                            clientList.node[index].SID = new Array();
                            clientList.node[index].nameNode = new Array();

                            clientList.node[index].SID.push(users[i].SID);
                            clientList.node[index].nameNode.push(users[i].nameNode);
                        } else if (b == -1) {
                            clientList.node[index].SID.push(users[i].SID);
                            clientList.node[index].nameNode.push(users[i].nameNode);
                        } else {
                            clientList.node[index].SID[b] = users[i].SID;
                            clientList.node[index].nameNode[b] = users[i].nameNode;
                        }
                        //console.log(clientList.node[index].SID[i]);
                    }
                    //console.log(JSON.stringify(clientList.node));
                }).catch(error => console.log('This error occured', error));
            })
            .catch(error => console.log('This error occured', error));

    });
});

http.listen(port, function () {
    console.log('listening on :' + port);
    User.sync()
        .then(() => {
            //console.log('sync ok');
            User.findAll().then(user => {
                console.log("sync ok: " + user.length) + "users";
            });
        })
        .catch(error => console.log('This error occured', error));

});