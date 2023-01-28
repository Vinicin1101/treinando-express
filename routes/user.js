const express = require('express');
const router = express.Router();

// importando a conexão com o banco
const connection = require('./../connection');

// importando nosso verificador de token bolado
const verifyJWT = require('../middlewares/verifyJWT');

// Point-end para retornar os dados do usuário logado
router.get('/user', verifyJWT, function (req, res) {
    const decoded = req.payload;

    const dataAtual = new Date().getTime() / 1000;
    if (decoded.exp > dataAtual) {
        return res.status(404).json({ message: 'Token inválido ou expirado' });
    }

    // Capturando o ID do usuário (o ID é retornado dentro do payload, que é tratado no verifyJWT)
    const ID = req.payload.ID;

    // Preparação da query
    const sql = "SELECT nome, email FROM usuarios WHERE ID = ? ";

    // Dados do usuário
    let data;

    // Execução da query
    connection.query(sql, [ID], (err, result) => {
        if (err) {
            console.error(err);
            return;
        } else if (result.length > 0) {
            data = result[0];

            // Retorno dos dados
            return res.json(data);
        } else if (result.length === 0) {
            return res.json({ menssage: "Usuário inexistente" });
        }
    })
})

module.exports = router;