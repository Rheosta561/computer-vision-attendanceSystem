"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventRouter = void 0;
const hono_1 = require("hono");
const zod_1 = require("zod");
const event_controller_1 = require("../controllers/event.controller");
const ApiError_1 = require("../utils/ApiError");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const faculty_middleware_1 = require("../middlewares/faculty.middleware");
const ApiResponse_1 = require("../utils/ApiResponse");
const event_controller_2 = require("../controllers/event.controller");
const event_controller_3 = require("../controllers/event.controller");
exports.eventRouter = new hono_1.Hono();
const createEventSchema = zod_1.z.object({
    title: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    dateTime: zod_1.z.string(),
    facultyId: zod_1.z.string(),
    groupId: zod_1.z.string(),
    attendeesIds: zod_1.z.array(zod_1.z.string()).default([]),
    weightage: zod_1.z.number().optional(),
});
const updateEventSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    dateTime: zod_1.z.string().optional(),
    attendeesIds: zod_1.z.array(zod_1.z.string()).optional(),
    weightage: zod_1.z.number().optional(),
});
// creating the event 
exports.eventRouter.get('/my-events', auth_middleware_1.verifyJWT, async (c) => {
    const user = c.get('user');
    const query = c.req.query('q') || undefined;
    const cursor = c.req.query('cursor') || undefined;
    const limit = Number(c.req.query('limit') || 10);
    return c.json(await (0, event_controller_2.getMyGroupEvents)({
        userId: user.id,
        query,
        cursor,
        limit
    }));
});
exports.eventRouter.post('/', auth_middleware_1.verifyJWT, faculty_middleware_1.requireFaculty, async (c) => {
    try {
        const body = await c.req.json();
        const dto = createEventSchema.parse(body);
        const res = await (0, event_controller_1.createEvent)(dto);
        return c.json(res);
    }
    catch (err) {
        if (err instanceof Error)
            return c.json(new ApiError_1.ApiError(400, err.message), 400);
        return c.json(new ApiError_1.ApiError(500, 'Unexpected error'), 500);
    }
});
// get event by Id 
exports.eventRouter.get('/:eventId', auth_middleware_1.verifyJWT, async (c) => {
    try {
        const { eventId } = c.req.param();
        const res = await (0, event_controller_1.getEvent)(eventId);
        return c.json(res);
    }
    catch (err) {
        if (err instanceof ApiError_1.ApiError)
            return c.json(err);
        return c.json(new ApiError_1.ApiError(500, 'Unexpected error'), 500);
    }
});
// search the events 
exports.eventRouter.get('/', auth_middleware_1.verifyJWT, async (c) => {
    try {
        const query = c.req.query('q');
        const facultyId = c.req.query('facultyId');
        const groupId = c.req.query('groupId');
        const cursor = c.req.query('cursor');
        const limit = Number(c.req.query('limit') ?? 10);
        const res = await (0, event_controller_1.searchEvents)({
            query,
            facultyId,
            groupId,
            cursor,
            limit,
        });
        return c.json(res);
    }
    catch (err) {
        return c.json(new ApiError_1.ApiError(500, 'Unexpected error'), 500);
    }
});
// updating the event 
exports.eventRouter.patch('/:eventId', auth_middleware_1.verifyJWT, faculty_middleware_1.requireFaculty, async (c) => {
    try {
        const { eventId } = c.req.param();
        const body = await c.req.json();
        const dto = updateEventSchema.parse(body);
        const res = await (0, event_controller_1.updateEvent)(eventId, dto);
        return c.json(res);
    }
    catch (err) {
        if (err instanceof ApiError_1.ApiError)
            return c.json(err);
        return c.json(new ApiError_1.ApiError(500, 'Unexpected error'), 500);
    }
});
// get gropu events 
exports.eventRouter.get("/group/my", auth_middleware_1.verifyJWT, async (c) => {
    try {
        const user = c.get("user");
        const userId = user.id;
        const { q, cursor, limit } = c.req.query();
        const apiResponse = await (0, event_controller_2.getMyGroupEvents)({
            userId,
            query: q,
            cursor,
            limit: limit ? Number(limit) : undefined
        });
        return c.json({ res: apiResponse });
    }
    catch (err) {
        console.error("GET /events/group/my ERROR", err);
        return c.json(new ApiResponse_1.ApiResponse(500, null, "Failed to fetch group events"), { status: 500 });
    }
});
// deleting the event 
exports.eventRouter.delete('/:eventId', auth_middleware_1.verifyJWT, faculty_middleware_1.requireFaculty, async (c) => {
    try {
        const { eventId } = c.req.param();
        const res = await (0, event_controller_1.deleteEvent)(eventId);
        console.log(res);
        return c.json(res);
    }
    catch (err) {
        if (err instanceof ApiError_1.ApiError)
            return c.json(err);
        return c.json(new ApiError_1.ApiError(500, 'Unexpected error'), 500);
    }
});
// get events of one group 
exports.eventRouter.get('/group/:groupId', auth_middleware_1.verifyJWT, async (c) => {
    try {
        const groupId = c.req.param('groupId');
        const query = c.req.query('q') ?? undefined;
        const cursor = c.req.query('cursor') ?? undefined;
        const limit = c.req.query('limit')
            ? parseInt(c.req.query('limit'))
            : 10;
        const res = await (0, event_controller_3.getGroupEvents)({
            groupId,
            query,
            cursor,
            limit
        });
        return c.json(res);
    }
    catch (err) {
        console.error('Group events error', err);
        return c.json(new ApiResponse_1.ApiResponse(err.statusCode ?? 500, null, err.message ?? 'Something went wrong'), err.statusCode ?? 500);
    }
});
