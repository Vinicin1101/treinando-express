// importando o express
const express = require('express');

// importando o body-parser
const bodyParser = require('body-parser');

// importando o dotenv
const dotenv = require('dotenv');
require('dotenv').config();

// importando a biblioteca que verifica o token
const jwt = require('jsonwebtoken');

// importando nosso verificador de token bolado
const verifyJWT = require('./verifyJWT');

// importando o middleware de sessão
const session = require('express-session');

// importando as rotas
const access = require('./routes/access');

// Porta de funcionamento do servidor (não colocar no .env)
const PORT = process.env.PORT || 3000;

// Segredo do token
const SECRET = process.env.JWT_SECRET

// instanciando o app
const app = express();

// usando json no corpo
app.use(bodyParser.json());

// função principal
async function main() {

    app.use(session({
        secret: SECRET,
        resave: false,
        saveUninitialized: true
    }));


    // Rota de cadastro
    app.use('/access', access)

    // Responsavel por servir a rota raiz
    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/public/index.html');
    });

    app.get('/login', (req, res) => {
        res.sendFile(__dirname + '/public/login.html');
    });

    app.get('/signup', (req, res) => {
        res.sendFile(__dirname + '/public/sign.html');
    });

    app.get('/logged', (req, res) => {
        res.send('Logado');
    });

    // Iniciando o servidor
    app.listen(PORT, () => {
        console.log(`Servidor iniciado na porta ${PORT}`)
    });
}

main();