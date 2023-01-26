const express = require('express');
const router = express.Router();

// importando o mecanismo de criptografia
const bcrypt = require('bcrypt');

// importando o gerador de tokens
const jwt = require('jsonwebtoken');

// importando o limitador de requisições
const rateLimit = require('express-rate-limit');

// importando a conexão com o banco
const connection = require('./../connection');

// importando a biblioteca de validações
const validator = require('validator');

// importando nosso verificador de token bolado
const verifyJWT = require('./../verifyJWT');


// Variaveis do auth token
const JWT_SECRET = process.env.JWT_SECRET
const ISSUER = process.env.ISSUER

// Rate Limit
/** 5 tentativas de login. Se um usuário exceder esse limite, eles receberão o alerta e sera bloqueado por 15 minutos*/
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos de countdown
    max: 5, // Limite por ip
    message: "Muitas tentativas de login, tente novamente mais tarde."
});

router.post('/signup', (req, res) => {

    // Extraindo os dados do usuário vindo na resuisição
    const { nome, email, senha } = req.body;

    // Validando as entradas
    if (validator.isEmpty(nome)) {
        return res.status(400).send({ message: "Nome inválido" });
    }
    if (!validator.isEmail(email)) {
        return res.status(400).send({ message: "Email inválido" });
    }
    if (!validator.isStrongPassword(senha)) {
        return res.status(400).send({ message: "Senha fraca" });
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
            // Email duplicado
            if (err.code.includes("ER_DUP_ENTRY")) {
                return res.status(401).json({ message: 'Erro ao cadastrar usuário, email em uso' });
            }

            return res.status(500).json({ message: 'Erro ao cadastrar usuário' });
        } else {
            // gras a deus foi
            return res.json({ message: 'Usuário cadastrado com sucesso' });
        }
    });
});

// Rota de login
router.post('/login', loginLimiter, (req, res) => {

    // Extraindo os dados do usuário vindo na resuisição
    const { email, senha } = req.body;

    console.log(req.body);

    // Validando as entradas
    if (!validator.isEmail(email)) {
        return res.status(400).send({ message: "Email inválido" });
    }

    // Preparando a string SQL
    const sql = 'SELECT senha FROM usuarios WHERE email = ?';

    // dados que serão verificados no banco
    const data = [email];

    // Execução da query
    connection.query(sql, data, (err, results) => {

        // Tratando possiveis erros
        if (err) {
            // console.log(err);
            return res.status(500).json({ message: 'Erro ao realizar login' });
        } else if (results.length > 0) {
            // comparando a senha fornecida pelo usuário com a senha criptografada armazenada no banco de dados
            const pass = bcrypt.compareSync(senha, results[0].senha);

            if (pass) {

                // Gerando o token de autenticação
                const payload = { email: email };
                const options = { expiresIn: '1d', issuer: ISSUER };
                const secret = JWT_SECRET;
                const token = jwt.sign(payload, secret, options);

                // Enviando a resposta pro cliente
                // return res.json({ message: 'Login realizado com sucesso', token, auth: true });
                req.session.token = token;
                return res.redirect('/logged')
            } else {
                // Senha incorreta (! esse comentário não pode ser público !)
                return res.status(401).json({ message: 'Email ou senha incorretos', auth: false });
            }

        } else {
            // Email incorreto (! esse comentário não pode ser público !)
            return res.status(401).json({ message: 'Email ou senha incorretos', auth: false });
        }

    })

    // Só é acessível com um token válido
    router.get('/logged', verifyJWT, (req, res) => {
        res.send("Logged");
    });
})


module.exports = router;
