"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
var jsonwebtoken_1 = require("jsonwebtoken");
function authMiddleware(req, res, next) {
    var authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).json({ error: 'Token not provided' });
    }
    var _a = authorization.split(' '), token = _a[1];
    try {
        var decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default_secret');
        var _b = decoded, id = _b.id, role = _b.role;
        req.userId = id;
        req.userRole = role;
        return next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Token invalid' });
    }
}
