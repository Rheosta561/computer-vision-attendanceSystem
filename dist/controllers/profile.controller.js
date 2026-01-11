"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.createProfile = void 0;
const prismaClient_1 = require("../config/prismaClient");
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
// creating profile 
const createProfile = async (userId, data) => {
    const { embeddings } = data;
    if (!embeddings || !Array.isArray(embeddings) || embeddings.length === 0) {
        throw new ApiError_1.ApiError(400, 'Embeddings are required');
    }
    const existing = await prismaClient_1.prisma.profile.findUnique({
        where: { userId },
    });
    if (existing) {
        throw new ApiError_1.ApiError(409, 'Profile already exists');
    }
    const profile = await prismaClient_1.prisma.profile.create({
        data: {
            userId,
            embeddings,
        },
    });
    return new ApiResponse_1.ApiResponse(201, profile, 'Profile created successfully');
};
exports.createProfile = createProfile;
// update profile 
const updateProfile = async (userId, data) => {
    const { embeddings } = data;
    // validation
    if (!embeddings || !Array.isArray(embeddings) || embeddings.length === 0) {
        throw new ApiError_1.ApiError(400, "Embeddings are required");
    }
    // upsert profile
    const profile = await prismaClient_1.prisma.profile.upsert({
        where: { userId },
        create: {
            userId,
            embeddings,
        },
        update: {
            embeddings,
        },
    });
    return new ApiResponse_1.ApiResponse(200, profile, "Profile created/updated successfully");
};
exports.updateProfile = updateProfile;
