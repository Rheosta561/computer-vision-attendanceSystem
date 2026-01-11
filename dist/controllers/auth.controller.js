import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '@/config/prismaClient';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { generateAccessAndRefreshTokens } from '../utils/tokenGenerator';
import { generatePassword } from '../utils/passwordGenerator';
import { sendEmail } from '@/utils/sendMail';
import crypto from 'crypto';
const isProduction = process.env.NODE_ENV === 'production';
// DTU email validation regex
const ALLOWED_DOMAIN = '@dtu.ac.in';
const isDTUEmail = (email) => {
    return email.toLowerCase().endsWith(ALLOWED_DOMAIN);
};
// registering user 
export const registerUser = async (c) => {
    const { email, password, name, role: requestRole } = await c.req.json();
    const role = requestRole || 'student';
    if (!email || !password || !name || !role) {
        throw new ApiError(400, 'all fields are required');
    }
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });
    if (existingUser) {
        throw new ApiError(409, ' User already exists');
    }
    if (!isDTUEmail(email)) {
        throw new ApiError(403, 'Only dtu email addresses are allowed');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
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
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);
    setCookie(c, 'accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Strict',
        maxAge: 60 * 15,
        path: '/',
    });
    setCookie(c, 'refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Strict',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    });
    return c.json(new ApiResponse(201, user, 'User registered successfully'), 201);
};
// login user
export const loginUser = async (c) => {
    const { email, password } = await c.req.json();
    if (!email || !password) {
        throw new ApiError(400, 'Email and password are required');
    }
    if (!isDTUEmail(email)) {
        throw new ApiError(403, 'Only dtu email addresses are allowed');
    }
    const user = await prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        throw new ApiError(401, 'Invalid credentials');
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);
    setCookie(c, 'accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Strict',
        maxAge: 60 * 15,
        path: '/',
    });
    setCookie(c, 'refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Strict',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    });
    return c.json(new ApiResponse(200, {
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
// logout user
export const logoutUser = async (c) => {
    deleteCookie(c, 'accessToken');
    deleteCookie(c, 'refreshToken');
    deleteCookie(c, 'faculty_key');
    return c.json(new ApiResponse(200, {}, 'Logged out successfully'));
};
// refresh session
export const refreshSession = async (c) => {
    const refreshTokenCookie = getCookie(c, 'refreshToken') ||
        (await c.req.json().catch(() => null))?.refreshToken;
    const refreshTokenHeader = c.req.header('refreshToken');
    const refreshToken = refreshTokenCookie || refreshTokenHeader;
    if (!refreshToken) {
        throw new ApiError(401, 'Unauthorized');
    }
    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
        });
        if (!user) {
            throw new ApiError(401, 'Invalid refresh token');
        }
        const { accessToken, refreshToken: newRefreshToken, } = await generateAccessAndRefreshTokens(user.id);
        setCookie(c, 'accessToken', accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 60 * 15,
            path: '/',
        });
        setCookie(c, 'refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });
        return c.json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, 'Session refreshed'));
    }
    catch {
        throw new ApiError(401, 'Invalid or expired refresh token');
    }
};
export const assignFacultyKey = async (c) => {
    const user = c.get('user');
    if (!user) {
        throw new ApiError(401, 'Unauthorized');
    }
    if (user.role !== 'faculty') {
        throw new ApiError(403, 'Faculty access required');
    }
    const facultyKey = crypto
        .createHmac('sha256', process.env.FACULTY_SECRET_KEY)
        .update(user.id)
        .digest('hex');
    setCookie(c, 'faculty_key', facultyKey, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Strict',
        maxAge: 60 * 60 * 24,
    });
    return c.json(new ApiResponse(200, { facultyKey }, 'Faculty key assigned'));
};
// share credentials via email
export const getCredentials = async (c) => {
    const { email, name } = await c.req.json();
    if (!email || !name) {
        throw new ApiError(400, 'Email and name are required');
    }
    //  DTU email restriction
    if (!isDTUEmail(email)) {
        throw new ApiError(403, 'Only dtu email addresses are allowed');
    }
    //  Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });
    if (existingUser) {
        return c.json(new ApiResponse(200, { exists: true }, 'Account already exists'));
    }
    //  random password
    const rawPassword = generatePassword({
        length: 12,
    });
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    //  user
    const user = await prisma.user.create({
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
    await sendEmail({
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
    return c.json(new ApiResponse(201, { user }, 'Account created and credentials sent to email'), 201);
};
// change password 
export const changePassword = async (c) => {
    const user = c.get('user');
    if (!user) {
        throw new ApiError(401, 'Unauthorized');
    }
    const { currentPassword, newPassword } = await c.req.json();
    if (!currentPassword || !newPassword) {
        throw new ApiError(400, 'Current password and new password are required');
    }
    const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
    });
    if (!existingUser) {
        throw new ApiError(404, 'User not found');
    }
    const isMatch = await bcrypt.compare(currentPassword, existingUser.password);
    if (!isMatch) {
        throw new ApiError(401, 'Current password is incorrect');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
        },
    });
    return c.json(new ApiResponse(200, {}, 'Password changed successfully'));
};
// forget password 
export const forgotPassword = async (c) => {
    const { email } = await c.req.json();
    if (!email) {
        throw new ApiError(400, 'Email is required');
    }
    // DTU email restriction
    if (!isDTUEmail(email)) {
        throw new ApiError(403, 'Only dtu email addresses are allowed');
    }
    const user = await prisma.user.findUnique({
        where: { email },
    });
    // no revealing user existence
    if (!user) {
        return c.json(new ApiResponse(200, {}, 'If the account exists, credentials have been sent to email'));
    }
    // Generate temporary password
    const tempPassword = generatePassword({
        length: 12,
    });
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    await prisma.user.update({
        where: { email },
        data: {
            password: hashedPassword,
        },
    });
    // Send email
    await sendEmail({
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
    return c.json(new ApiResponse(200, {}, 'If the account exists, credentials have been sent to email'));
};
