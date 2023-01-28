const express = require('express');
const router = express.Router();

// importando a nossa conexão com o banco
const connection = require('./../connection');

// dotenv
const dotenv = require('dotenv');
dotenv.config()

// importando o jwt
const jwt = require('jsonwebtoken');

// importando a biblioteca com serviço de email
const nodemailer = require('nodemailer');

// importando o bcrypt
const bcrypt = require('bcrypt');

// configurações do servidor de email
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT;

const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});

// JWT env
const JWT_ISSUER = process.env.JWT_ISSUER;

const RP_SECRET = process.env.RP_SECRET;

// endpoint para resetar a senha
router.post('/forgetmypass', (req, res) => {
    const { email } = req.body;
    const user_email = email

    if (!validator.isEmail(user_email)) {
        return res.status(400).json({ message: 'Forneça um email válido' });
    }

    // Verificando se o email está associada a uma conta no banco
    // string sql
    const sql = "SELECT email FROM usuarios WHERE email = ?";

    // Executando da query
    connection.query(sql, [user_email], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Não foi possivel verificar o endereço de email' });
        } else if (result.length > 0) { // Email registrado

            // Criando token
            const payload = { email: user_email }; // carga, no caso apenas o email do usuário
            const options = { expiresIn: '1d', issuer: JWT_ISSUER }; // tempo de expiração e emissor
            const secret = RP_SECRET; // Segredo para assinaturaa do token
            const token = jwt.sign(payload, secret, options); // token final

            // criando o email
            const mailOptions = {
                from: EMAIL_USER,
                to: user_email,
                subject: 'Reset de senha',
                text: 'Clique no link para resetar sua senha: 127.0.0.1:3000/reset?token=' + token
            };

            // Enviando email para o proprietario
            transporter.sendMail(mailOptions, function (error, info) {
                if (!error) {
                    registerToken(token, user_email);
                    return res.status(200).json({ message: `Um email de recuperação foi enviado para ${user_email}.` });
                }
            });
        } else if (result.length === 0) {
            return res.status(404).json({ message: 'Email não encontrado.' })
        }
    });
});

// Verificando se o token é valido (fazemos isso checando se o payload é um email registrado no banco que esta associado ao token)
router.get('/reset/:token', async (req, res) => {
    const { token } = req.params;
    const decoded = jwt.verify(token, RP_SECRET);

    const dataAtual = new Date().getTime() / 1000;
    if (decoded.exp > dataAtual) {
        return res.status(404).json({ message: 'Token inválido ou expirado' });
    }

    try {
        connection.query('SELECT reset_pass_token FROM usuarios WHERE email = ?', [decoded.email], (err, result) => {
            if (result.length > 0 && result[0].reset_pass_token === token) {
                return res.status(202).json({ token });
            } else {
                return res.status(404).json({ error: 'Token inválido ou expirado' });
            }
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Erro ao verificar token' });
    }
});

router.post('/reset/:token', (req, res) => {
    const { token } = req.params;
    const { password } = req.body

    try {
        // decodificando o token
        const decoded = jwt.verify(token, RP_SECRET);

        const dataAtual = new Date().getTime() / 1000;
        if (decoded.exp > dataAtual) {
            return res.status(404).json({ message: 'Token inválido ou expirado' });
        }

        if (!validator.isStrongPassword(password)) return res.status(400).json({ error: 'A senha não é forte o suficiente' });

        // Gerando o hash da nova senha
        const hash = bcrypt.hashSync(password, 10);

        // inserinido a nova senha no banco
        connection.query('UPDATE usuario SET senha = ? WHERE email = ?', [hash, decoded.email], (err, result, fields) => {
            if (fields == 1) return res.status(200).json({ message: 'Senha atualizada com sucesso' });
        });

    } catch (error) {
        console.log(err);
        return res.status(500).json({ error: 'Erro ao verificar token' });
    }
});

module.exports = router;