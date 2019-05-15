const app = require('express')();
var port = process.env.PORT || 3000;
const http = require('http').Server(app);
const io = require('socket.io')(http);
var sslRedirect = require('heroku-ssl-redirect');
const tcp = require('net');
const tcpPort = 7070;
const tcpServer = tcp.createServer();
tcpServer.listen(tcpPort, () => {
    console.log("TCP Server on *:7070");
});
var queReqChangeLogic = new Object();
queReqChangeLogic.id = new Array();
queReqChangeLogic.logic = new Array();
var nodeList = new Object();

nodeList.HWID = new Array();
nodeList.address = new Array();
nodeList.isConnect = new Array();

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

//const redis = require('socket.io-redis');
var utils = require('./api/utils');
var User = require('./api/db/table').userModel();
var Node = require('./api/db/table');
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
const init = require('./route')(app);

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
app.get('/test', function (req, res, next) {
    var model = Node.nodeModel('A0004');
    var buffer = new Array();
    var buf = {
        time: '2019-03-10 18:15:01.000+07',
        tegangan: 222.2,
        arus: '2.2',
        suhuEnv: '22',
        suhuLine: '23',
        kondisi: 'aman',
        kondisiSSR: '0'
    };
    buffer.push(buf);
    buffer.push(buf);
    model.sync().then(() => {
        console.log('bulk sync!');
        model.bulkCreate(buffer).then(data => {
            console.log('bulk insert ok');
        })
    });

    res.status(200);
});
//====================================== Socket IO Event Handler ====================================//

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

//========================================== NODE HANDLER ======================================//
tcpServer.on('connection', function (sock) {
    console.log('Connected: ' + sock.remoteAddress + ':' + sock.remotePort);
    sock.on('data', function (data) {
        if (data.indexOf('ping') > -1) {
            // console.log(data);
            var strData = data.toString();
            var splt = strData.split(","); // 1: HWID
            var index = nodeList.HWID.indexOf(splt[1]);
            if (index > -1) {
                nodeList.HWID[index] = splt[1];
                nodeList.address[index] = sock.remoteAddress;
                nodeList.isConnect[index] = 1;
            } else {
                nodeList.HWID.push(splt[1]);
                nodeList.address.push(sock.remoteAddress);
                nodeList.isConnect.push(1);
            }
            
            sock.write("OKE@");
        } else {
            var a = JSON.parse(data);
            console.log("DATA " + sock.remoteAddress + ", " + data.byteLength + ": " + a.sid);
            // console.log(JSON.stringify(data));
            var sidd = a.sid;
            var model = Node.nodeModel(sidd.toString());
            var buffer = new Array();
            console.log(a.times[0]);
            for (var i = 0; i < a.tegangan.length; i++) {
                var buf = {
                    time: a.times[i],
                    tegangan: a.tegangan[i],
                    arus: a.arus[i],
                    suhuEnv: a.suhuEnv[i],
                    suhuLine: a.suhuLine[i],
                    kondisi: a.kondisi[i],
                    kondisiSSR: a.kondisiSSR[i]
                };
                buffer.push(buf);
            }
            model.sync().then(() => {
                console.log('bulk sync!');
                model.bulkCreate(buffer).then(data => {
                    console.log('bulk insert ok');
                })
            });
            
            var check = queReqChangeLogic.id.indexOf(sidd.toString());
            console.log(sidd + ','+ check);
            if(check > -1){
                console.log("gnti SSR");
                sock.write("?"+queReqChangeLogic.logic[check]+'@');
                queReqChangeLogic.logic.splice(check);
                queReqChangeLogic.id.splice(check);
                
            } else {
                sock.write("OK");
            }
        }
    });
    sock.on('close', function (data) {
        console.log("Disconnect " + sock.remoteAddress);
        var index = nodeList.address.indexOf(sock.remoteAddress);
        if (index > -1) {
            nodeList.isConnect[index] = 0;
        }
    });
    sock.on('error', function (data) {
        console.error(data);
    })
});
io.on('connection', function (socket) {
    console.log('a user connected: ' + socket.request.connection.remoteAddress);
    //socket.send("Your ID: " + socket.id);
    io.sockets.connected[socket.id].emit("ID", socket.id);
    socket.on('disconnect', function () {
        var b = clientList.ID.indexOf(socket.id);
        console.log('web client: ' + clientList.user[b] + ' is disconnected');
    });

    //=========================================== Webclient Handler =================================//

    socket.on("readNodeLastData", function (data) {
        var spl = data.split(","); //0: username, 1: nodename
        var i = clientList.user.indexOf(spl[0]);
        var nn = clientList.node[i].nameNode.indexOf(spl[1]);
        var model = Node.nodeModel(clientList.node[i].SID[nn]);
        var findIndex = nodeList.HWID.indexOf(clientList.node[i].SID[nn]);
        var iscn = 0;
        if (findIndex > -1) {
            iscn = nodeList.isConnect[findIndex];
        }
        model.count().then(c => {
            model.findById(c).then(d => {
                // console.log(d);
                var buf = {
                    listnode: clientList.node[i].SID[nn],
                    tegangan: d.get('tegangan'),
                    arus: d.get('arus'),
                    kondisi: d.get('kondisi'),
                    kondisiSSR: d.get('kondisiSSR'),
                    isConnect: iscn
                };
                io.sockets.connected[socket.id].emit("LastData", buf);
                // console.log(buf);
            }).catch(e => {
                console.log(e);
            });
        });


    });

    socket.on('datalogRequest', function (data) {
        var split = data.split(','); //0: namenode , 1: page, 2: username
        var page = split[1] * 60;
        var ip = clientList.user.indexOf(split[2]);
        split[0] = decodeURI(split[0]);
        var i = clientList.node[ip].nameNode.indexOf(split[0]);
        var model = Node.nodeModel(clientList.node[ip].SID[i]);
        var Op = utils.Opt();
        var buffer = new Array();
        console.log(split[0]);
        console.log("Datalog reqeust: " + clientList.node[ip].SID[i] + ", page: " + page);
        model.count().then(c => {
            console.log("TOTAL DATA: " + c);
            var b = c - page;
            var a = b - 60;
            a = a > 0 ? a : 0;
            model.findAll({
                order: [
                    ['id', 'DESC']
                ],
                where: {
                    id: {
                        [Op.between]: [a, b]
                    }
                }
            }).then(datas => {
                console.log("Datalog size: " + datas.length + " packet");
                for (var k = 0; k < datas.length; k++) {
                    var buf = {
                        id: datas[k].get('id'),
                        time: datas[k].get('time'),
                        tegangan: datas[k].get('tegangan'),
                        arus: datas[k].get('arus'),
                        suhuEnv: datas[k].get('suhuEnv'),
                        suhuLine: datas[k].get('suhuLine'),
                        kondisi: datas[k].get('kondisi'),
                        kondisiSSR: datas[k].get('kondisiSSR')
                    };
                    buffer.push(buf);
                }
                // console.log(buffer);
                io.sockets.connected[socket.id].emit("datalogResponse", buffer);

            });
        });
    });
    socket.on('maxPage', function (data) {
        var a = data.split(','); //0: username, 1: namenode
        var ip = clientList.user.indexOf(a[0]);
        var i = clientList.node[ip].nameNode.indexOf(a[1]);
        var model = Node.nodeModel(clientList.node[ip].SID[i]);
        model.findAll().then(datas => {
            var asd = Math.round(datas.length / 60) + 1;
            console.log("max page: " + asd + " page");
            io.sockets.connected[socket.id].emit("maxPageResponse", asd);
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

    socket.on('reqSSRChangeLogic', function(data){
        var a = data.split(",") // 0: Node ID, 1 = Logic
        console.log("CONTROL SSR: " + data);
        var check = queReqChangeLogic.id.indexOf(a[0]);
        if(check > -1){
            queReqChangeLogic.logic[check] = a[1];
        } else {
            queReqChangeLogic.id.push(a[0]);
            queReqChangeLogic.logic.push(a[1]);
        }
        console.log(queReqChangeLogic);
    });

    socket.on("getNode", function (data) {
        var modul = utils.getNode(data);
        modul.sync()
            .then(() => {
                //console.log('sync ok');
                modul.findAll().then(users => {
                    //console.log("maman : " + JSON.stringify(users) + " \n" + users[0].SID);
                    var index = clientList.user.indexOf(data);
                    //console.log("ID CLIENT: " + clientList.user[index]);
                    if (index > -1) {
                        // console.log(users);
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