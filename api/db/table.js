const sequelize = require('./db');
const Sequelize = require('sequelize');
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

function node(nodeName){
    var nd = sequelize.define(nodeName, {
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
    return nd;
} 

module.exports = {
    userModel: () => {
        return usr;
    },
    nodeModel: (name) => {
        return node(name);
    }
}