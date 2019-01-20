const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const redis = require('socket.io-redis');

//===================================== HTTP Event Handler ========================================//
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.get('/', function (req, res, next) {
    res.status(200).send('<h1>Hello world</h1>');
});

//====================================== Socket IO Event Handler ====================================//

io.on('connection', function (socket) {
    console.log('a user connected: ' + socket.id);
    socket.send("Your ID: " + socket.id);
    io.sockets.connected[socket.id].emit("greeting", "Howdy, User 1!");
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});

var port = process.env.PORT || 8099;
http.listen(port, function () {
    console.log('listening on *:' + port);
});