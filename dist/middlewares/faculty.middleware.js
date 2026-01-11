"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireFaculty = void 0;
const cookie_1 = require("hono/cookie");
const crypto_1 = __importDefault(require("crypto"));
const ApiError_1 = require("../utils/ApiError");
const requireFaculty = async (c, next) => {
    const user = c.get('user');
    if (!user) {
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    }
    // role check 
    if (user.role !== 'faculty') {
        throw new ApiError_1.ApiError(403, 'Faculty access required');
    }
    const cookieKey = (0, cookie_1.getCookie)(c, 'faculty_key');
    const headerKey = c.req.header('x-faculty_key') ||
        c.req.header('faculty_key');
    const facultyKey = cookieKey || headerKey;
    if (!facultyKey) {
        throw new ApiError_1.ApiError(403, 'Faculty key missing');
    }
    // expected faculty key
    const expectedKey = crypto_1.default
        .createHmac('sha256', process.env.FACULTY_SECRET_KEY)
        .update(user.id)
        .digest('hex');
    if (facultyKey !== expectedKey) {
        throw new ApiError_1.ApiError(403, 'Invalid faculty key');
    }
    // all checks passed
    await next();
};
exports.requireFaculty = requireFaculty;
