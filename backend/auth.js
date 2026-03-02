const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'barbearia-secret-key-2024';

function generateToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acesso necessário' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
}

module.exports = { generateToken, authenticateToken, JWT_SECRET };
