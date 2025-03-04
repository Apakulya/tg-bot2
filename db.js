const {Sequelize} = require('sequelize');

module.exports = new Sequelize(
    'telega-bot',
    'postgres',
    'mypassword',
    {
        host: 'localhost',
        dialect: 'postgres'
    }
)