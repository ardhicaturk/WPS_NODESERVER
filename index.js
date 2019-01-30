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

/*
Additional nodeList:
-Status
-RSSI
-Tegangan
-Arus
-Sakelar
-Kondisi
*/
var clientList = new Object();
clientList.user = new Array();
clientList.ID = new Array();
clientList.node = new Array();
clientList.node.SID = new Array();
clientList.node.nameNode = new Array();
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
    var a = nodeList.name.indexOf(SID);
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
        var i = clientList.node.findIndex(x => x.SID == a[2]);
        var name;
        if(i > -1){
            name = clientList.node[i].nameNode;
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
    //=========================================== Webclient Handler =================================//
    socket.on('webClient', function (data) {
        var a = data.split(",") // 0: username, 1: ID
        console.log('web client: ' + a[0] + " is connected!");
        var b = clientList.user.indexOf(a[0]);
        if (b > -1) {
            clientList.ID[b] = a[1];
        } else {
            clientList.ID.push(a[1]);
            clientList.user.push(a[0]);
        }
    });

    socket.on("getNode", function(data){
        var modul = loginPage.getNode(data);
        modul.sync()
        .then(() => {
            //console.log('sync ok');
            modul.findAll().then(users => {
                //console.log("maman : " + JSON.stringify(users) + " \n" + users[0].SID);
                var index = clientList.user.indexOf(data);
                //console.log("ID CLIENT: " + clientList.ID[index]);
                io.sockets.connected[clientList.ID[index]].emit("responseGetNode", users);
                for(var i = 0; i < users.length; i++){
                    var a = {SID: users[i].SID, nameNode: users[i].nameNode};
                    var b = clientList.node.findIndex(x => x.SID == users[i].SID);
                    if(b > -1){
                        clientList.node[b].SID = users[i].SID;
                        clientList.node[b].nameNode = users[i].nameNode;
                    } else {
                        clientList.node.push(a);
                    }
                }
                console.log(JSON.stringify(clientList.node));
            });
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
                console.log("sync ok: " + user.length) +"users";
            });
        })
        .catch(error => console.log('This error occured', error));

});