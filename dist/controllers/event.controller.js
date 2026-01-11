import { prisma } from '@/config/prismaClient';
import { ApiError } from '@/utils/ApiError';
import { ApiResponse } from '@/utils/ApiResponse';
// create event controller 
export const createEvent = async (data) => {
    const event = await prisma.event.create({
        data: {
            title: data.title,
            description: data.description,
            dateTime: new Date(data.dateTime),
            facultyId: data.facultyId,
            groupId: data.groupId,
            attendeesIds: data.attendeesIds,
            weightage: data.weightage,
        },
    });
    return new ApiResponse(201, event, 'Event created successfully');
};
// getEvent controller 
export const getEvent = async (eventId) => {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
    });
    if (!event)
        throw new ApiError(404, 'Event not found');
    return new ApiResponse(200, event, 'Event fetched successfully');
};
// search event controller (with cursor pagination) faculty id only appliead if prvided in order to fetch faculty's events 
export const searchEvents = async ({ query, facultyId, groupId, cursor, limit = 10 }) => {
    const where = { AND: [] };
    if (query?.trim()) {
        where.AND.push({
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
            ],
        });
    }
    if (facultyId)
        where.AND.push({ facultyId });
    if (groupId)
        where.AND.push({ groupId });
    const events = await prisma.event.findMany({
        where: where.AND.length ? where : undefined,
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
    });
    let nextCursor = null;
    let hasMore = false;
    if (events.length > limit) {
        const nextItem = events.pop();
        nextCursor = nextItem.id;
        hasMore = true;
    }
    return new ApiResponse(200, { events, nextCursor, hasMore }, 'Events fetched successfully');
};
// /upadate event 
export const updateEvent = async (eventId, data) => {
    const event = await prisma.event.update({
        where: { id: eventId },
        data: {
            ...data,
            dateTime: data.dateTime ? new Date(data.dateTime) : undefined,
        },
    });
    return new ApiResponse(200, event, 'event updated successfully');
};
//  deleteEvent 
export const deleteEvent = async (eventId) => {
    await prisma.event.delete({
        where: { id: eventId },
    });
    return new ApiResponse(200, null, 'event deleted successfully');
};
// get events fro the groups I am a part of 
export const getMyGroupEvents = async ({ userId, query, cursor, limit = 10 }) => {
    const groups = await prisma.group.findMany({
        where: {
            OR: [
                { members: { has: userId } },
                { facultyId: userId }
            ]
        },
        select: { id: true }
    });
    if (!groups.length) {
        return new ApiResponse(200, { events: [], nextCursor: null, hasMore: false }, 'User is not part of any groups');
    }
    const groupIds = groups.map(g => g.id);
    const where = {
        groupId: { in: groupIds }
    };
    if (query?.trim()) {
        where.OR = [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
        ];
    }
    const events = await prisma.event.findMany({
        where,
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        // orderinng
        orderBy: [
            { updatedAt: 'desc' },
            { createdAt: 'desc' }
        ],
    });
    let nextCursor = null;
    let hasMore = false;
    if (events.length > limit) {
        const nextItem = events.pop();
        nextCursor = nextItem.id;
        hasMore = true;
    }
    return new ApiResponse(200, { events, nextCursor, hasMore }, 'Group events fetched successfully');
};
export const getGroupEvents = async ({ groupId, query, cursor, limit = 10 }) => {
    const where = { groupId };
    if (query?.trim()) {
        where.OR = [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
        ];
    }
    const events = await prisma.event.findMany({
        where,
        take: limit + 1, // fetch one extra to check hasMore
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: [
            { updatedAt: 'desc' },
            { createdAt: 'desc' }
        ]
    });
    let nextCursor = null;
    let hasMore = false;
    if (events.length > limit) {
        const nextItem = events.pop();
        nextCursor = nextItem.id;
        hasMore = true;
    }
    return new ApiResponse(200, { events, nextCursor, hasMore }, 'Group events fetched successfully');
};
