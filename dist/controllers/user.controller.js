"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAttendanceStats = exports.deleteUser = exports.updateUser = exports.getUser = void 0;
const prismaClient_1 = require("../config/prismaClient");
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
// get user 
const getUser = async (userId) => {
    const user = await prismaClient_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            profileURL: true,
            createdAt: true,
        },
    });
    if (!user)
        throw new ApiError_1.ApiError(404, 'User not found');
    return new ApiResponse_1.ApiResponse(200, user, 'User fetched successfully');
};
exports.getUser = getUser;
//  update user 
const updateUser = async (userId, data) => {
    const user = await prismaClient_1.prisma.user.update({
        where: { id: userId },
        data,
    });
    return new ApiResponse_1.ApiResponse(200, user, 'User updated successfully');
};
exports.updateUser = updateUser;
// delete user 
const deleteUser = async (userId) => {
    await prismaClient_1.prisma.user.delete({
        where: { id: userId },
    });
    return new ApiResponse_1.ApiResponse(200, null, 'User deleted successfully');
};
exports.deleteUser = deleteUser;
// attendance stats 
const getAttendanceStats = async (userId, cursor, limit = 10) => {
    // groups user belongs to
    const groups = await prismaClient_1.prisma.group.findMany({
        where: { members: { has: userId } },
    });
    const groupIds = groups.map(g => g.id);
    if (groupIds.length === 0) {
        return new ApiResponse_1.ApiResponse(200, {
            totalEvents: 0,
            attendedEvents: 0,
            attendancePercent: 0,
            events: [],
            nextCursor: null,
            hasMore: false,
        }, 'No group activity found');
    }
    // count totals
    const totalEvents = await prismaClient_1.prisma.event.count({
        where: { groupId: { in: groupIds } },
    });
    const attendedEvents = await prismaClient_1.prisma.event.count({
        where: {
            groupId: { in: groupIds },
            attendeesIds: { has: userId },
        },
    });
    // fetch paginated events (most recent first)
    const events = await prismaClient_1.prisma.event.findMany({
        where: { groupId: { in: groupIds } },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined
    });
    let nextCursor = null;
    let hasMore = false;
    if (events.length > limit) {
        const nextItem = events.pop();
        nextCursor = nextItem.id;
        hasMore = true;
    }
    // mark attended
    const detailedEvents = events.map(e => ({
        id: e.id,
        title: e.title,
        dateTime: e.dateTime,
        groupId: e.groupId,
        attended: e.attendeesIds.includes(userId),
    }));
    const attendancePercent = totalEvents === 0
        ? 0
        : Math.round((attendedEvents / totalEvents) * 100);
    return new ApiResponse_1.ApiResponse(200, {
        totalEvents,
        attendedEvents,
        attendancePercent,
        events: detailedEvents,
        nextCursor,
        hasMore,
    }, 'Attendance stats fetched successfully');
};
exports.getAttendanceStats = getAttendanceStats;
