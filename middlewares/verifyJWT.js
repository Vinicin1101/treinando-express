// importando o jwt
const jwt = require('jsonwebtoken');

const dotenv = require('dotenv');
dotenv.config()

const SECRET = process.env.JWT_SECRET

// função middleware (passada antes da requisição ser servida)
function verifyJWT(req, res, next) {
    const token = req.headers["authorization"].split(" ")[1];

    // Sem token 
    if (!token) return res.status(401).send({ auth: false, message: 'Nenhum token fornecido.' });

    // Com token
    jwt.verify(token, SECRET, function (err, decoded) {
        if (err) return res.status(500).send({ auth: false, message: 'Erro, token inválido.' });

        // Token correto
        req.payload = jwt.decode(token, SECRET); // Decriptografando o token e passando para o payload
        next();
    });
};


module.exports = verifyJWT;