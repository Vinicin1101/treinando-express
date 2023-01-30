const express = require('express');
const router = express.Router();

// importando a nossa conexão com o banco
const connection = require('../connection');

// dotenv
const dotenv = require('dotenv');
dotenv.config()

// importando o jwt
const jwt = require('jsonwebtoken');

// importando o bcrypt
const bcrypt = require('bcrypt');

// importando a biblioteca de validações
const validator = require('validator');

// JWT env
const RP_SECRET = process.env.RP_SECRET;

// Verificando se o token é valido (fazemos isso checando se o payload é um email registrado no banco que esta associado ao token)
router.get('/reset', async (req, res) => {
    const { token } = req.query;

    // Decodificando o token (await serve para ele esperar o jtw.verify() e então atribuir o retorno em decoded)
    let decoded = await jwt.verify(token, RP_SECRET, async function (err, decode) {
        if (err) throw err;
        return decode; // retornando
    });

    // verificando a expiração do token
    const dataAtual = (new Date().getTime() + 1) / 1000;
    if (!decoded.exp > dataAtual.toFixed()) {
        return res.status(404).json({ message: 'Token inválido ou expirado' });
    }

    connection.query('SELECT reset_pass_token FROM usuarios WHERE email = (?)', [decoded.email], (err, result) => {

        if (err) {
            return res.status(404).json({ error: 'Erro' });
        }

        if (result.length > 0 && result[0].reset_pass_token === token) {
            return res.status(202).json({ token });
        } else {
            return res.status(404).json({ error: 'Token inválido ou expirado' });
        }
    });

});

router.post('/reset', async (req, res) => {
    // const { token } = req.query;
    const token = req.headers["authorization"].split(" ")[1];
    const { NewPass } = req.body

    // decodificando o token
    let decoded = await jwt.verify(token, RP_SECRET, async function (err, decode) {
        if (err) throw err;
        return decode; // retornando
    });

    // verificando a expiração do token
    const dataAtual = (new Date().getTime() + 1) / 1000;
    if (!decoded.exp > dataAtual.toFixed()) {
        return res.status(404).json({ message: 'Token inválido ou expirado' });
    }

    if (!validator.isStrongPassword(NewPass)) return res.status(400).json({ error: 'A senha não é forte o suficiente' });

    // Gerando o hash da nova senha
    const hash = bcrypt.hashSync(NewPass, 10);

    // inserinido a nova senha no banco
    connection.query('UPDATE usuarios SET senha = ? WHERE email = ?', [hash, decoded.email], (err, fields) => {
        if (err) return res.status(500).json({ message: err.message });
        if (fields.affectedRows >= 1) return res.status(200).json({ message: 'Senha atualizada com sucesso' });

        return res.status(400).json({ message: 'Não foi possivel atualizar a senha' });

    });

});

module.exports = router;