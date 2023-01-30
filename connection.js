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

// Limpando o console
console.clear()

// Conexão com o banco de dados

const connection = mysql.createConnection({
    host: DB.HOST,
    user: DB.USER,
    password: DB.PASS,
    database: DB.NAME
});

connection.connect((err) => {
    if (err) {
        if (err.fatal) {
            return console.error(`\n\x1B[31m[✕] Erro ao conectar com o banco de dados \n[${err.message}]\x1B[0m`);
        }

        return console.error(`\n\x1B[31m[✕] Erro ao conectar com o banco de dados \n[${err.sqlMessage}]\x1B[0m`);
    }
    return console.log(`\n\x1B[32m[✓] Banco de dados conectado!\x1B[0m \n`);
});

module.exports = connection;