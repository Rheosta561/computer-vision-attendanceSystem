"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMember = exports.getMyGroups = exports.joinGroupByCode = exports.getGroupByCode = exports.getGroupWithMembers = exports.toggleInvite = exports.leaveGroup = exports.joinGroup = exports.searchGroups = exports.deleteGroup = exports.updateGroup = exports.getGroup = exports.createGroup = void 0;
const prismaClient_1 = require("../config/prismaClient");
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const client_1 = require("@prisma/client");
const groupCode_1 = require("../utils/groupCode");
//  attaching embeddings with members
const attachEmbeddingsToUsers = async (users) => {
    const profiles = await prismaClient_1.prisma.profile.findMany({
        where: {
            userId: { in: users.map(u => u.id) },
        },
        select: {
            userId: true,
            embeddings: true,
        },
    });
    const profileMap = new Map(profiles.map(p => [p.userId, p.embeddings]));
    return users.map(u => ({
        ...u,
        embeddings: profileMap.get(u.id) ?? null,
    }));
};
// create group with retry 
const createGroup = async (data) => {
    let attempt = 0;
    while (attempt < 5) {
        try {
            const group = await prismaClient_1.prisma.group.create({
                data: {
                    name: data.name,
                    facultyId: data.facultyId,
                    members: data.members ?? [],
                    code: (0, groupCode_1.generateGroupCode)(),
                },
            });
            return new ApiResponse_1.ApiResponse(201, group, 'Group created successfully');
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                err.code === 'P2002' // unique constraint failed
            ) {
                attempt++;
                continue; //new code+retyr 
            }
            throw err;
        }
    }
    throw new ApiError_1.ApiError(500, 'Could not generate a unique group code');
};
exports.createGroup = createGroup;
// get group 
const getGroup = async (groupId) => {
    const group = await prismaClient_1.prisma.group.findUnique({
        where: { id: groupId },
    });
    if (!group)
        throw new ApiError_1.ApiError(404, 'Group not found');
    const members = await prismaClient_1.prisma.user.findMany({
        where: { id: { in: group.members } },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    });
    const membersWithEmbeddings = await attachEmbeddingsToUsers(members);
    return new ApiResponse_1.ApiResponse(200, {
        group,
        memberDetails: membersWithEmbeddings,
    }, 'Group fetched successfully');
};
exports.getGroup = getGroup;
// update group 
const updateGroup = async (groupId, data) => {
    const group = await prismaClient_1.prisma.group.update({
        where: { id: groupId },
        data,
    });
    const members = await prismaClient_1.prisma.user.findMany({
        where: { id: { in: group.members } },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    });
    const membersWithEmbeddings = await attachEmbeddingsToUsers(members);
    return new ApiResponse_1.ApiResponse(200, { ...group, members: membersWithEmbeddings }, 'Group updated successfully');
};
exports.updateGroup = updateGroup;
// delete group 
const deleteGroup = async (groupId) => {
    const group = await prismaClient_1.prisma.group.findUnique({
        where: { id: groupId },
    });
    if (!group)
        throw new ApiError_1.ApiError(400, 'Group already deleted');
    await prismaClient_1.prisma.group.delete({
        where: { id: groupId },
    });
    return new ApiResponse_1.ApiResponse(200, null, 'Group deleted successfully');
};
exports.deleteGroup = deleteGroup;
// search group 
const searchGroups = async ({ query, facultyId, cursor, limit = 10, }) => {
    const where = {};
    if (query) {
        where.name = { contains: query, mode: 'insensitive' };
    }
    if (facultyId) {
        where.facultyId = facultyId;
    }
    const groups = await prismaClient_1.prisma.group.findMany({
        where,
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
    });
    let nextCursor = null;
    let hasMore = false;
    if (groups.length > limit) {
        const nextItem = groups.pop();
        nextCursor = nextItem.id;
        hasMore = true;
    }
    return new ApiResponse_1.ApiResponse(200, { groups, nextCursor, hasMore }, 'Groups fetched successfully');
};
exports.searchGroups = searchGroups;
// join group by ID
const joinGroup = async (groupId, userId) => {
    const group = await prismaClient_1.prisma.group.findUnique({
        where: { id: groupId },
    });
    if (!group)
        throw new ApiError_1.ApiError(404, 'Group not found');
    if (group.members.includes(userId)) {
        throw new ApiError_1.ApiError(400, 'User is already a member of the group');
    }
    const updated = await prismaClient_1.prisma.group.update({
        where: { id: groupId },
        data: {
            members: {
                push: userId,
            },
        },
    });
    return new ApiResponse_1.ApiResponse(200, updated, 'Joined group successfully');
};
exports.joinGroup = joinGroup;
// leave group 
const leaveGroup = async (groupId, userId) => {
    const group = await prismaClient_1.prisma.group.findUnique({
        where: { id: groupId },
    });
    if (!group)
        throw new ApiError_1.ApiError(404, 'Group not found');
    if (!group.members.includes(userId)) {
        throw new ApiError_1.ApiError(400, 'Not in the group');
    }
    const updatedMembers = group.members.filter((m) => m !== userId);
    const updated = await prismaClient_1.prisma.group.update({
        where: { id: groupId },
        data: { members: updatedMembers },
    });
    return new ApiResponse_1.ApiResponse(200, updated, 'Left group successfully');
};
exports.leaveGroup = leaveGroup;
const toggleInvite = async (groupId) => {
    const group = await prismaClient_1.prisma.group.findUnique({
        where: { id: groupId },
    });
    if (!group)
        throw new ApiError_1.ApiError(404, 'Group not found');
    const updated = await prismaClient_1.prisma.group.update({
        where: { id: groupId },
        data: { inviteEnabled: !group.inviteEnabled },
    });
    return new ApiResponse_1.ApiResponse(200, updated, updated.inviteEnabled ? 'Invite enabled' : 'Invite disabled');
};
exports.toggleInvite = toggleInvite;
const getGroupWithMembers = async (groupId) => {
    const group = await prismaClient_1.prisma.group.findUnique({
        where: { id: groupId },
    });
    if (!group)
        throw new ApiError_1.ApiError(404, 'Group not found');
    const members = await prismaClient_1.prisma.user.findMany({
        where: { id: { in: group.members } },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    });
    const membersWithEmbeddings = await attachEmbeddingsToUsers(members);
    return new ApiResponse_1.ApiResponse(200, { ...group, members: membersWithEmbeddings }, 'Group export successful');
};
exports.getGroupWithMembers = getGroupWithMembers;
const getGroupByCode = async (code) => {
    const group = await prismaClient_1.prisma.group.findUnique({
        where: { code },
    });
    if (!group)
        throw new ApiError_1.ApiError(404, 'Group not found');
    return new ApiResponse_1.ApiResponse(200, group, 'Group fetched successfully');
};
exports.getGroupByCode = getGroupByCode;
const joinGroupByCode = async (code, userId) => {
    const group = await prismaClient_1.prisma.group.findUnique({
        where: { code },
    });
    if (!group)
        throw new ApiError_1.ApiError(404, 'Group not found');
    if (!group.inviteEnabled)
        throw new ApiError_1.ApiError(403, 'Group is closed for joining');
    if (group.members.includes(userId))
        throw new ApiError_1.ApiError(400, 'Already a member');
    const updated = await prismaClient_1.prisma.group.update({
        where: { id: group.id },
        data: { members: { push: userId } },
    });
    return new ApiResponse_1.ApiResponse(200, updated, 'Joined group successfully');
};
exports.joinGroupByCode = joinGroupByCode;
//get groups where i am partcipant
const getMyGroups = async (userId) => {
    const groups = await prismaClient_1.prisma.group.findMany({
        where: {
            OR: [
                { members: { has: userId } },
                { facultyId: userId }
            ]
        },
        orderBy: { createdAt: 'desc' }
    });
    return new ApiResponse_1.ApiResponse(200, groups, 'Fetched user groups');
};
exports.getMyGroups = getMyGroups;
const removeMember = async (groupId, memberId) => {
    const group = await prismaClient_1.prisma.group.findUnique({
        where: { id: groupId },
    });
    if (!group)
        throw new ApiError_1.ApiError(404, 'Group not found');
    if (!group.members.includes(memberId)) {
        throw new ApiError_1.ApiError(400, 'Member not found in group');
    }
    const updatedMembers = group.members.filter((m) => m !== memberId);
    const updated = await prismaClient_1.prisma.group.update({
        where: { id: groupId },
        data: { members: updatedMembers },
    });
    return new ApiResponse_1.ApiResponse(200, updated, 'Member removed successfully');
};
exports.removeMember = removeMember;
