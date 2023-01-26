// importando a biblioteca do mysql
const mysql = require('mysql2');

// importando o dotenv
const dotenv = require('dotenv');
require('dotenv').config();

// Variaveis do banco
const DB = {
    HOST: process.env.HOST || 'localhost',
    USER: process.env.USER || 'root',
    PASS: process.env.PASS || '',
    NAME: process.env.NAME || 'test'
}

// Conexão com o banco de dados
const connection = mysql.createConnection({
    host: DB.HOST,
    user: DB.USER,
    password: DB.PASS,
    database: DB.NAME
});

connection.connect();

module.exports = connection;