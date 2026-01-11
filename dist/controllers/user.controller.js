import { prisma } from '@/config/prismaClient';
import { ApiError } from '@/utils/ApiError';
import { ApiResponse } from '@/utils/ApiResponse';
// get user 
export const getUser = async (userId) => {
    const user = await prisma.user.findUnique({
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
        throw new ApiError(404, 'User not found');
    return new ApiResponse(200, user, 'User fetched successfully');
};
//  update user 
export const updateUser = async (userId, data) => {
    const user = await prisma.user.update({
        where: { id: userId },
        data,
    });
    return new ApiResponse(200, user, 'User updated successfully');
};
// delete user 
export const deleteUser = async (userId) => {
    await prisma.user.delete({
        where: { id: userId },
    });
    return new ApiResponse(200, null, 'User deleted successfully');
};
// attendance stats 
export const getAttendanceStats = async (userId, cursor, limit = 10) => {
    // groups user belongs to
    const groups = await prisma.group.findMany({
        where: { members: { has: userId } },
    });
    const groupIds = groups.map(g => g.id);
    if (groupIds.length === 0) {
        return new ApiResponse(200, {
            totalEvents: 0,
            attendedEvents: 0,
            attendancePercent: 0,
            events: [],
            nextCursor: null,
            hasMore: false,
        }, 'No group activity found');
    }
    // count totals
    const totalEvents = await prisma.event.count({
        where: { groupId: { in: groupIds } },
    });
    const attendedEvents = await prisma.event.count({
        where: {
            groupId: { in: groupIds },
            attendeesIds: { has: userId },
        },
    });
    // fetch paginated events (most recent first)
    const events = await prisma.event.findMany({
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
    return new ApiResponse(200, {
        totalEvents,
        attendedEvents,
        attendancePercent,
        events: detailedEvents,
        nextCursor,
        hasMore,
    }, 'Attendance stats fetched successfully');
};
