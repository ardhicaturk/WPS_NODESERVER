
var Sequelize = require('sequelize');
const sequelize = require('./db/db');
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
    Opt: function(){
        return Sequelize.Op;
    },
    getNode: function (username) {
        var modul = newUser(username);
        return modul;
    }
    //etc
}
