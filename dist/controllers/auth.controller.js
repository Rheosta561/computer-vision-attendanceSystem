"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgotPassword = exports.changePassword = exports.getCredentials = exports.assignFacultyKey = exports.refreshSession = exports.logoutUser = exports.loginUser = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prismaClient_1 = require("../config/prismaClient");
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const cookie_1 = require("hono/cookie");
const tokenGenerator_1 = require("../utils/tokenGenerator");
const passwordGenerator_1 = require("../utils/passwordGenerator");
const sendMail_1 = require("../utils/sendMail");
const crypto_1 = __importDefault(require("crypto"));
const isProduction = process.env.NODE_ENV === 'production';
// DTU email validation regex
const ALLOWED_DOMAIN = '@dtu.ac.in';
const isDTUEmail = (email) => {
    return email.toLowerCase().endsWith(ALLOWED_DOMAIN);
};
// registering user 
const registerUser = async (c) => {
    const { email, password, name, role: requestRole } = await c.req.json();
    const role = requestRole || 'student';
    if (!email || !password || !name || !role) {
        throw new ApiError_1.ApiError(400, 'all fields are required');
    }
    const existingUser = await prismaClient_1.prisma.user.findUnique({
        where: { email },
    });
    if (existingUser) {
        throw new ApiError_1.ApiError(409, ' User already exists');
    }
    if (!isDTUEmail(email)) {
        throw new ApiError_1.ApiError(403, 'Only dtu email addresses are allowed');
    }
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const user = await prismaClient_1.prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
            role,
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
        },
    });
    const { accessToken, refreshToken } = await (0, tokenGenerator_1.generateAccessAndRefreshTokens)(user.id);
    (0, cookie_1.setCookie)(c, 'accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Strict',
        maxAge: 60 * 15,
        path: '/',
    });
    (0, cookie_1.setCookie)(c, 'refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Strict',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    });
    return c.json(new ApiResponse_1.ApiResponse(201, user, 'User registered successfully'), 201);
};
exports.registerUser = registerUser;
// login user
const loginUser = async (c) => {
    const { email, password } = await c.req.json();
    if (!email || !password) {
        throw new ApiError_1.ApiError(400, 'Email and password are required');
    }
    if (!isDTUEmail(email)) {
        throw new ApiError_1.ApiError(403, 'Only dtu email addresses are allowed');
    }
    const user = await prismaClient_1.prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        throw new ApiError_1.ApiError(404, 'User not found');
    }
    const isValidPassword = await bcrypt_1.default.compare(password, user.password);
    if (!isValidPassword) {
        throw new ApiError_1.ApiError(401, 'Invalid credentials');
    }
    const { accessToken, refreshToken } = await (0, tokenGenerator_1.generateAccessAndRefreshTokens)(user.id);
    (0, cookie_1.setCookie)(c, 'accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Strict',
        maxAge: 60 * 15,
        path: '/',
    });
    (0, cookie_1.setCookie)(c, 'refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Strict',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    });
    return c.json(new ApiResponse_1.ApiResponse(200, {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
        accessToken,
        refreshToken,
    }, 'Login successful'));
};
exports.loginUser = loginUser;
// logout user
const logoutUser = async (c) => {
    (0, cookie_1.deleteCookie)(c, 'accessToken');
    (0, cookie_1.deleteCookie)(c, 'refreshToken');
    (0, cookie_1.deleteCookie)(c, 'faculty_key');
    return c.json(new ApiResponse_1.ApiResponse(200, {}, 'Logged out successfully'));
};
exports.logoutUser = logoutUser;
// refresh session
const refreshSession = async (c) => {
    const refreshTokenCookie = (0, cookie_1.getCookie)(c, 'refreshToken') ||
        (await c.req.json().catch(() => null))?.refreshToken;
    const refreshTokenHeader = c.req.header('refreshToken');
    const refreshToken = refreshTokenCookie || refreshTokenHeader;
    if (!refreshToken) {
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await prismaClient_1.prisma.user.findUnique({
            where: { id: decoded.id },
        });
        if (!user) {
            throw new ApiError_1.ApiError(401, 'Invalid refresh token');
        }
        const { accessToken, refreshToken: newRefreshToken, } = await (0, tokenGenerator_1.generateAccessAndRefreshTokens)(user.id);
        (0, cookie_1.setCookie)(c, 'accessToken', accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 60 * 15,
            path: '/',
        });
        (0, cookie_1.setCookie)(c, 'refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });
        return c.json(new ApiResponse_1.ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, 'Session refreshed'));
    }
    catch {
        throw new ApiError_1.ApiError(401, 'Invalid or expired refresh token');
    }
};
exports.refreshSession = refreshSession;
const assignFacultyKey = async (c) => {
    const user = c.get('user');
    if (!user) {
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    }
    if (user.role !== 'faculty') {
        throw new ApiError_1.ApiError(403, 'Faculty access required');
    }
    const facultyKey = crypto_1.default
        .createHmac('sha256', process.env.FACULTY_SECRET_KEY)
        .update(user.id)
        .digest('hex');
    (0, cookie_1.setCookie)(c, 'faculty_key', facultyKey, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Strict',
        maxAge: 60 * 60 * 24,
    });
    return c.json(new ApiResponse_1.ApiResponse(200, { facultyKey }, 'Faculty key assigned'));
};
exports.assignFacultyKey = assignFacultyKey;
// share credentials via email
const getCredentials = async (c) => {
    const { email, name } = await c.req.json();
    if (!email || !name) {
        throw new ApiError_1.ApiError(400, 'Email and name are required');
    }
    //  DTU email restriction
    if (!isDTUEmail(email)) {
        throw new ApiError_1.ApiError(403, 'Only dtu email addresses are allowed');
    }
    //  Check if user already exists
    const existingUser = await prismaClient_1.prisma.user.findUnique({
        where: { email },
    });
    if (existingUser) {
        return c.json(new ApiResponse_1.ApiResponse(200, { exists: true }, 'Account already exists'));
    }
    //  random password
    const rawPassword = (0, passwordGenerator_1.generatePassword)({
        length: 12,
    });
    const hashedPassword = await bcrypt_1.default.hash(rawPassword, 10);
    //  user
    const user = await prismaClient_1.prisma.user.create({
        data: {
            email,
            name,
            password: hashedPassword,
            role: 'student',
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
        },
    });
    //  password via email
    await (0, sendMail_1.sendEmail)({
        to: email,
        subject: 'Your DTU-Attendance Portal Credentials',
        html: `
      <h2>Welcome, ${name}</h2>
      <p>Your DTU-Attendance Portal account has been created.</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Temporary Password:</strong> ${rawPassword}</p>
      <br />
      <p>Please log in and change your password immediately.</p>
      <br />
      <p>— Tech DTU</p>
    `,
    });
    return c.json(new ApiResponse_1.ApiResponse(201, { user }, 'Account created and credentials sent to email'), 201);
};
exports.getCredentials = getCredentials;
// change password 
const changePassword = async (c) => {
    const user = c.get('user');
    if (!user) {
        throw new ApiError_1.ApiError(401, 'Unauthorized');
    }
    const { currentPassword, newPassword } = await c.req.json();
    if (!currentPassword || !newPassword) {
        throw new ApiError_1.ApiError(400, 'Current password and new password are required');
    }
    const existingUser = await prismaClient_1.prisma.user.findUnique({
        where: { id: user.id },
    });
    if (!existingUser) {
        throw new ApiError_1.ApiError(404, 'User not found');
    }
    const isMatch = await bcrypt_1.default.compare(currentPassword, existingUser.password);
    if (!isMatch) {
        throw new ApiError_1.ApiError(401, 'Current password is incorrect');
    }
    const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
    await prismaClient_1.prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
        },
    });
    return c.json(new ApiResponse_1.ApiResponse(200, {}, 'Password changed successfully'));
};
exports.changePassword = changePassword;
// forget password 
const forgotPassword = async (c) => {
    const { email } = await c.req.json();
    if (!email) {
        throw new ApiError_1.ApiError(400, 'Email is required');
    }
    // DTU email restriction
    if (!isDTUEmail(email)) {
        throw new ApiError_1.ApiError(403, 'Only dtu email addresses are allowed');
    }
    const user = await prismaClient_1.prisma.user.findUnique({
        where: { email },
    });
    // no revealing user existence
    if (!user) {
        return c.json(new ApiResponse_1.ApiResponse(200, {}, 'If the account exists, credentials have been sent to email'));
    }
    // Generate temporary password
    const tempPassword = (0, passwordGenerator_1.generatePassword)({
        length: 12,
    });
    const hashedPassword = await bcrypt_1.default.hash(tempPassword, 10);
    await prismaClient_1.prisma.user.update({
        where: { email },
        data: {
            password: hashedPassword,
        },
    });
    // Send email
    await (0, sendMail_1.sendEmail)({
        to: email,
        subject: 'DTU Attendance Portal – Password Reset',
        html: `
      <h2>Password Reset</h2>
      <p>Your password has been reset.</p>
      <p><strong>Temporary Password:</strong> ${tempPassword}</p>
      <br />
      <p>Please log in and change your password immediately.</p>
      <br />
      <p>— Tech DTU</p>
    `,
    });
    return c.json(new ApiResponse_1.ApiResponse(200, {}, 'If the account exists, credentials have been sent to email'));
};
exports.forgotPassword = forgotPassword;
