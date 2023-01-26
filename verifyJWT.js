// função middleware (passada antes da requisição ser servida)
function verifyJWT(req, res, next) {
    const token = req.headers["authorization"].split(" ")[1];

    // Sem token 
    if (!token) return res.status(401).send({ auth: false, message: 'Nenhum token fornecido.' });

    // Com token
    jwt.verify(token, SECRET, function (err, decoded) {
        if (err) return res.status(500).send({ auth: false, message: 'Erro, token inválido.' });

        // Token correto
        next();
    });
};


module.exports = verifyJWT;