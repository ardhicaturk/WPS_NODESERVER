var Sequelize = require('sequelize');
var hs ='mysql://wpsserver:wpsserver123@te-ja.id:3306/wpsserver';
var sequelize = new Sequelize(process.env.DATABASE_URL || hs, {
    logging: false
});

module.exports = sequelize;