"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cookie_1 = require("hono/cookie");
const prismaClient_1 = require("@/config/prismaClient");
const ApiError_1 = require("../utils/ApiError");
const verifyJWT = async (c, next) => {
    try {
        //fetching token 
        const token = (0, cookie_1.getCookie)(c, 'accessToken') ||
            c.req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            throw new ApiError_1.ApiError(401, 'Unauthorized request');
        }
        // verfication 
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        //user fetch 
        const user = await prismaClient_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });
        if (!user) {
            throw new ApiError_1.ApiError(401, 'Invalid Access Token');
        }
        c.set('user', user);
        await next();
    }
    catch (error) {
        throw new ApiError_1.ApiError(401, error?.message || 'Invalid access token');
    }
};
exports.verifyJWT = verifyJWT;
