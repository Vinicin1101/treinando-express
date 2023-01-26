// importando o express
const express = require('express');

// importando o dotenv
const dotenv = require('dotenv');
require('dotenv').config();

// importando o bcrypt
const bcrypt = require('bcrypt');

// importando o jsonWebToken
const jwt = require('jsonwebtoken');

// importando o validator
const validator = require('validator');

// importando o mysql
const mysql = require("mysql2");

// importando o body-parser
const bodyParser = require('body-parser');

// Variaveis de Ambiente

// Porta de funcionamento do servidor (não colocar no .env)
const PORT = process.env.PORT || 3000;

// Variaveis do banco
const DB = {
    HOST: process.env.HOST || 'localhost',
    USER: process.env.USER || 'root',
    PASS: process.env.PASS || '',
    NAME: process.env.NAME || 'test'
}

// Variaveis do auth token
const JWT_SECRET = process.env.JWT_SECRET
const ISSUER = process.env.ISSUER

// instanciando o app
const app = express();

// usando o body-parser
app.use(bodyParser.json());

// função principal (assincrona, pois é necessário aguardar a conexão com o banco)
async function main() {

    // Conexão com o banco de dados
    const connection = mysql.createConnection({
        host: DB.HOST,
        user: DB.USER,
        password: DB.PASS,
        database: DB.NAME
    });

    // Rota de cadastro
    app.post('/signup', (req, res) => {

        // Extraindo os dados do usuário vindo na resuisição
        const { nome, email, senha } = req.body;

        // Validando as entradas
        if (validator.isEmpty(nome)) {
            res.status(400).send({ message: "Nome inválido" });
            return;
        }
        if (!validator.isEmail(email)) {
            res.status(400).send({ message: "Email inválido" });
            return;
        }
        if (!validator.isStrongPassword(senha)) {
            res.status(400).send({ message: "Senha fraca" });
            return;
        }

        // Gerando uma salted hash da senha (salted é temperada, ou seja, a senha é unica dentro da nossa aplicação )
        const hash = bcrypt.hashSync(senha, 10);

        // Preparando a string SQL
        const sql = 'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)';

        // arranjando os dados que serão enviados pro banco
        const data = [nome, email, hash];

        // Execução da query de inserção
        connection.query(sql, data, (err, results) => {

            // Tratando erros
            if (err) {
                console.log(err);

                // Email duplicado
                if (err.code.includes("ER_DUP_ENTRY")) {
                    res.status(401).json({ message: 'Erro ao cadastrar usuário, email em uso' });
                    return;
                }

                res.status(500).json({ message: 'Erro ao cadastrar usuário' });
                return;
            } else {
                // gras a deus foi
                res.json({ message: 'Usuário cadastrado com sucesso' });
                return;
            }
        });
    });

    // Rota de login
    app.post('/login', (req, res) => {

        // Extraindo os dados do usuário vindo na resuisição
        const { email, senha } = req.body;

        // Validando as entradas
        if (!validator.isEmail(email)) {
            res.status(400).send({ message: "Email inválido" });
            return;
        }

        // Sugestão

        /** Verificar o número de tentativas de login, implementar uma estratégia de bloqueio de conta. Armazenando o número de tentativas de login, a horário da última tentativa de login e o ip que tentou o login para cada usuário do banco de dados. A cada tentativa de login, verificar se o usuário atingiu o limite de tentativas permitidas e, se sim, bloquear temporariamente a conta do usuário. Notificaro dono da conta informando o ip que realizou a façanha usando req.ip. */

        // Preparando a string SQL
        const sql = 'SELECT senha FROM usuarios WHERE email = ?';

        // dados que serão verificados no banco
        const data = [email];

        // Execução da query
        connection.query(sql, data, (err, results) => {

            // Tratando possiveis erros
            if (err) {
                console.log(err);
                res.status(500).json({ message: 'Erro ao realizar login' });
                return;
            } else if (results.length > 0) {
                // comparando a senha fornecida pelo usuário com a senha criptografada armazenada no banco de dados
                const pass = bcrypt.compareSync(senha, results[0].senha);
                console.log(pass);
                if (pass) {

                    // Gerando o token de autenticação
                    const payload = { email: email };
                    const options = { expiresIn: '1d', issuer: ISSUER };
                    const secret = JWT_SECRET;
                    const token = jwt.sign(payload, secret, options);

                    // Enviando a resposta pro cliente
                    res.json({ message: 'Login realizado com sucesso', token });
                    return;
                } else {
                    res.status(401).json({ message: 'Email ou senha incorretos' });
                    return;
                }
            } else {
                res.status(401).json({ message: 'Email ou senha incorretos' });
                return;
            }

        })
    })

    // Responsavel pelas requisições na raiz
    app.get('/', (req, res) => {
        res.send("Hello World!");
    });

    // Iniciando o servidor
    app.listen(PORT, () => {
        console.log(`Servidor iniciado na porta ${PORT}`)
    });
}

main();