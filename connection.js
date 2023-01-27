// importando a biblioteca do mysql
const mysql = require('mysql2');

// importando o dotenv
const dotenv = require('dotenv');
require('dotenv').config();

// Variaveis do banco
const DB = {
    HOST: process.env.DB_HOST || 'localhost',
    USER: process.env.DB_USER || 'root',
    PASS: process.env.DB_PASS || '',
    NAME: process.env.DB_NAME || 'test'
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