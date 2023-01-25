// importando o express
const express = require('express');

// importando o dotenv
const dotenv = require('dotenv');

// importando o bcrypt
const bin = require('bcrypt');

// importando o mysql
const mysql = require("mysql2");

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

// instanciando o app
const app = express();

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
        const { nome, email, senha } = req.body

        // Gerando uma salted hash da senha (salted é temperada, ou seja, a senha é unica dentro da nossa aplicação )
        const hash = bcrypt.hashSync(senha, 10);

        // Preparando a string SQL
        const sql = 'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)';

        // arranjando os dados que serão enviados pro banco
        const data = [nome, email, hash];

        // Execução da query
        connection.query(sql, data, (err, results) => {
            // Tratando a resposta do banco

            if (err) { // deu erro :/
                console.log(err)
                res.status(500).json({ message: 'Erro ao cadastrar usuário' })
            } else { // : gras a deus foi
                res.json({ message: 'Usuário cadastrado com sucesso' })
            }
        });
    });

    // Rota de login
    app.post('/login', (req, res) => {

        // Extraindo os dados do usuário vindo na resuisiçaõ
        const { email, senha } = req.body

        // Preparando a string SQL
        const sql = 'SELECT senha FROM usuarios WHERE email = ?'

        // dados que serão verificados no banco
        const data = [email]

        // Execução da query
        connection.query(sql, data, (err, results) => {

            // Tratando possiveis erros
            if (err) { // Email não cadastrado, ou inválido
                console.log(err)
                res.status(500).json({ message: 'Erro ao realizar login' })
            } else if (results.length > 0) {
                // comparando a senha fornecida pelo usuário com a senha criptografada armazenada no banco de dados
                if (bcrypt.compareSync(senha, results[0].senha)) {
                    res.json({ message: 'Login realizado com sucesso' })
                } else {
                    res.status(401).json({ message: 'Email ou senha incorretos' })
                }
            } else {
                res.status(401).json({ message: 'Email ou senha incorretos' })
            }

            // Por padrão é melhor não enviar que a senha para um determinado email esta errada, ou vice-verça, pois isso deixaria facil um ataque à força bruta
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