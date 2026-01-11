"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePassword = void 0;
const crypto_1 = __importDefault(require("crypto"));
const generatePassword = ({ length = 12, includeUppercase = true, includeLowercase = true, includeNumbers = true, includeSymbols = true, } = {}) => {
    let charset = '';
    if (includeUppercase)
        charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase)
        charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers)
        charset += '0123456789';
    if (includeSymbols)
        charset += '!@#$%^&*()-_=+[]{}<>?';
    if (!charset) {
        throw new Error('At least one character set must be enabled');
    }
    const passwordChars = [];
    const randomBytes = crypto_1.default.randomBytes(length);
    for (let i = 0; i < length; i++) {
        const index = randomBytes[i] % charset.length;
        passwordChars.push(charset[index]);
    }
    return passwordChars.join('');
};
exports.generatePassword = generatePassword;
