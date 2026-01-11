"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const hono_1 = require("hono");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const ApiError_1 = require("../utils/ApiError");
const user_controller_1 = require("../controllers/user.controller");
const user_schema_1 = require("../validators/user.schema");
exports.userRouter = new hono_1.Hono();
// Auth required
exports.userRouter.use('*', auth_middleware_1.verifyJWT);
// get user 
exports.userRouter.get('/:userId', async (c) => {
    try {
        return c.json(await (0, user_controller_1.getUser)(c.req.param('userId')));
    }
    catch (err) {
        return c.json(err instanceof ApiError_1.ApiError ? err : new ApiError_1.ApiError(500));
    }
});
// update user 
exports.userRouter.patch('/:userId', async (c) => {
    try {
        const { userId } = c.req.param();
        const dto = user_schema_1.updateUserSchema.parse(await c.req.json());
        return c.json(await (0, user_controller_1.updateUser)(userId, dto));
    }
    catch (err) {
        return c.json(err instanceof ApiError_1.ApiError ? err : new ApiError_1.ApiError(500));
    }
});
// delete user 
exports.userRouter.delete('/:userId', async (c) => {
    try {
        return c.json(await (0, user_controller_1.deleteUser)(c.req.param('userId')));
    }
    catch (err) {
        return c.json(err instanceof ApiError_1.ApiError ? err : new ApiError_1.ApiError(500));
    }
});
// get Attendance 
exports.userRouter.get('/:userId/attendance', async (c) => {
    try {
        const { userId } = c.req.param();
        const cursor = c.req.query('cursor') || undefined;
        const limit = Number(c.req.query('limit')) || 10;
        return c.json(await (0, user_controller_1.getAttendanceStats)(userId, cursor, limit));
    }
    catch (err) {
        return c.json(err instanceof ApiError_1.ApiError ? err : new ApiError_1.ApiError(500));
    }
});
