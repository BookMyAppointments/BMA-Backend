"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const authenticateToken = async (req, res, next) => {
    try {
        const header = req.headers['authorization'];
        const token = header?.split(' ')[1];
        if (!token) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const verifiedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!verifiedToken) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const user = await prisma_1.prisma.user.findFirst({
            where: { email: verifiedToken.email }
        });
        if (!user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Error in authentication:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.authenticateToken = authenticateToken;
