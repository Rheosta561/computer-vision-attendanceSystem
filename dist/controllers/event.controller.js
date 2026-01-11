"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGroupEvents = exports.getMyGroupEvents = exports.deleteEvent = exports.updateEvent = exports.searchEvents = exports.getEvent = exports.createEvent = void 0;
const prismaClient_1 = require("@/config/prismaClient");
const ApiError_1 = require("@/utils/ApiError");
const ApiResponse_1 = require("@/utils/ApiResponse");
// create event controller 
const createEvent = async (data) => {
    const event = await prismaClient_1.prisma.event.create({
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
    return new ApiResponse_1.ApiResponse(201, event, 'Event created successfully');
};
exports.createEvent = createEvent;
// getEvent controller 
const getEvent = async (eventId) => {
    const event = await prismaClient_1.prisma.event.findUnique({
        where: { id: eventId },
    });
    if (!event)
        throw new ApiError_1.ApiError(404, 'Event not found');
    return new ApiResponse_1.ApiResponse(200, event, 'Event fetched successfully');
};
exports.getEvent = getEvent;
// search event controller (with cursor pagination) faculty id only appliead if prvided in order to fetch faculty's events 
const searchEvents = async ({ query, facultyId, groupId, cursor, limit = 10 }) => {
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
    const events = await prismaClient_1.prisma.event.findMany({
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
    return new ApiResponse_1.ApiResponse(200, { events, nextCursor, hasMore }, 'Events fetched successfully');
};
exports.searchEvents = searchEvents;
// /upadate event 
const updateEvent = async (eventId, data) => {
    const event = await prismaClient_1.prisma.event.update({
        where: { id: eventId },
        data: {
            ...data,
            dateTime: data.dateTime ? new Date(data.dateTime) : undefined,
        },
    });
    return new ApiResponse_1.ApiResponse(200, event, 'event updated successfully');
};
exports.updateEvent = updateEvent;
//  deleteEvent 
const deleteEvent = async (eventId) => {
    await prismaClient_1.prisma.event.delete({
        where: { id: eventId },
    });
    return new ApiResponse_1.ApiResponse(200, null, 'event deleted successfully');
};
exports.deleteEvent = deleteEvent;
// get events fro the groups I am a part of 
const getMyGroupEvents = async ({ userId, query, cursor, limit = 10 }) => {
    const groups = await prismaClient_1.prisma.group.findMany({
        where: {
            OR: [
                { members: { has: userId } },
                { facultyId: userId }
            ]
        },
        select: { id: true }
    });
    if (!groups.length) {
        return new ApiResponse_1.ApiResponse(200, { events: [], nextCursor: null, hasMore: false }, 'User is not part of any groups');
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
    const events = await prismaClient_1.prisma.event.findMany({
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
    return new ApiResponse_1.ApiResponse(200, { events, nextCursor, hasMore }, 'Group events fetched successfully');
};
exports.getMyGroupEvents = getMyGroupEvents;
const getGroupEvents = async ({ groupId, query, cursor, limit = 10 }) => {
    const where = { groupId };
    if (query?.trim()) {
        where.OR = [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
        ];
    }
    const events = await prismaClient_1.prisma.event.findMany({
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
    return new ApiResponse_1.ApiResponse(200, { events, nextCursor, hasMore }, 'Group events fetched successfully');
};
exports.getGroupEvents = getGroupEvents;
