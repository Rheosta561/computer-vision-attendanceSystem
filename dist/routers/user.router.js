import { Hono } from 'hono';
import { verifyJWT } from '@/middlewares/auth.middleware';
import { ApiError } from '@/utils/ApiError';
import { getUser, updateUser, deleteUser, getAttendanceStats, } from '@/controllers/user.controller';
import { updateUserSchema } from '@/validators/user.schema';
export const userRouter = new Hono();
// Auth required
userRouter.use('*', verifyJWT);
// get user 
userRouter.get('/:userId', async (c) => {
    try {
        return c.json(await getUser(c.req.param('userId')));
    }
    catch (err) {
        return c.json(err instanceof ApiError ? err : new ApiError(500));
    }
});
// update user 
userRouter.patch('/:userId', async (c) => {
    try {
        const { userId } = c.req.param();
        const dto = updateUserSchema.parse(await c.req.json());
        return c.json(await updateUser(userId, dto));
    }
    catch (err) {
        return c.json(err instanceof ApiError ? err : new ApiError(500));
    }
});
// delete user 
userRouter.delete('/:userId', async (c) => {
    try {
        return c.json(await deleteUser(c.req.param('userId')));
    }
    catch (err) {
        return c.json(err instanceof ApiError ? err : new ApiError(500));
    }
});
// get Attendance 
userRouter.get('/:userId/attendance', async (c) => {
    try {
        const { userId } = c.req.param();
        const cursor = c.req.query('cursor') || undefined;
        const limit = Number(c.req.query('limit')) || 10;
        return c.json(await getAttendanceStats(userId, cursor, limit));
    }
    catch (err) {
        return c.json(err instanceof ApiError ? err : new ApiError(500));
    }
});
