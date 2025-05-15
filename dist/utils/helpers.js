"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomHex = exports.formatDate = exports.generateVerificationCode = exports.comparePasswords = exports.hashPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const hashPassword = async (password) => {
    const salt = await bcryptjs_1.default.genSalt(10);
    return await bcryptjs_1.default.hash(password, salt);
};
exports.hashPassword = hashPassword;
const comparePasswords = async (plainText, hashedPassword) => {
    return await bcryptjs_1.default.compare(plainText, hashedPassword);
};
exports.comparePasswords = comparePasswords;
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.generateVerificationCode = generateVerificationCode;
const formatDate = (date, format = 'yyyy-MM-dd') => {
    const d = new Date(date);
    return format
        .replace('yyyy', d.getFullYear().toString())
        .replace('MM', (d.getMonth() + 1).toString().padStart(2, '0'))
        .replace('dd', d.getDate().toString().padStart(2, '0'));
};
exports.formatDate = formatDate;
const generateRandomHex = (bytes = 32) => {
    return crypto_1.default.randomBytes(bytes).toString('hex');
};
exports.generateRandomHex = generateRandomHex;
