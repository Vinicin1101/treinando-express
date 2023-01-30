const express = require('express');
const router = express.Router();

// importando a nossa conexão com o banco
const connection = require('../connection');

// dotenv
const dotenv = require('dotenv');
dotenv.config()

// importando o jwt
const jwt = require('jsonwebtoken');

// importando a biblioteca com serviço de email
const nodemailer = require('nodemailer');

// importando o bcrypt
const bcrypt = require('bcrypt');

// importando a biblioteca de validações
const validator = require('validator');

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
router.post('/forgotmypass', (req, res) => {
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

            // registrando token no banco
            const sucess = registerToken(token, user_email);
            if (!sucess) {
                return res.status(500).json("Falha ao registrar token de solicitação");
            }

            // criando o email
            const mailOptions = {
                from: EMAIL_USER,
                to: user_email,
                subject: 'Reset de senha',
                text: 'Clique no link para resetar sua senha: 127.0.0.1:3000/reset?token=' + token
            };

            // Enviando email para o proprietario
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    return res.status(500).json("Falha ao enviar email, tente novamente mais tarde.")
                }

                return res.status(200).json({ message: `Um email de recuperação foi enviado para ${user_email}.`, link: "127.0.0.1:3000/reset?token=" + token });
            });
        } else if (result.length === 0) {
            return res.status(404).json({ message: 'Email não encontrado.' })
        }
    });
});

async function registerToken(token, email) {
    connection.query('UPDATE usuarios SET reset_pass_token = ? WHERE email = ?', [token, email], (err, fields) => {

        if (err) {
            console.error(err);
            return false;
        }

        if (fields.affectedRows >= 1) return true;

        return false;
    })
}

module.exports = router;