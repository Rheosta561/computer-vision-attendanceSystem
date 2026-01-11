import { prisma } from '@/config/prismaClient';
import { ApiError } from '@/utils/ApiError';
import { ApiResponse } from '@/utils/ApiResponse';
// creating profile 
export const createProfile = async (userId, data) => {
    const { embeddings } = data;
    if (!embeddings || !Array.isArray(embeddings) || embeddings.length === 0) {
        throw new ApiError(400, 'Embeddings are required');
    }
    const existing = await prisma.profile.findUnique({
        where: { userId },
    });
    if (existing) {
        throw new ApiError(409, 'Profile already exists');
    }
    const profile = await prisma.profile.create({
        data: {
            userId,
            embeddings,
        },
    });
    return new ApiResponse(201, profile, 'Profile created successfully');
};
// update profile 
export const updateProfile = async (userId, data) => {
    const { embeddings } = data;
    // validation
    if (!embeddings || !Array.isArray(embeddings) || embeddings.length === 0) {
        throw new ApiError(400, "Embeddings are required");
    }
    // upsert profile
    const profile = await prisma.profile.upsert({
        where: { userId },
        create: {
            userId,
            embeddings,
        },
        update: {
            embeddings,
        },
    });
    return new ApiResponse(200, profile, "Profile created/updated successfully");
};
