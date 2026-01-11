"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileRouter = void 0;
const auth_middleware_1 = require("../middlewares/auth.middleware");
const hono_1 = require("hono");
const profile_controller_1 = require("../controllers/profile.controller");
exports.profileRouter = new hono_1.Hono();
exports.profileRouter.post('/', auth_middleware_1.verifyJWT, async (c) => {
    const user = c.get('user');
    const userId = user.id;
    const body = await c.req.json();
    return c.json(await (0, profile_controller_1.createProfile)(userId, body));
});
exports.profileRouter.patch('/', auth_middleware_1.verifyJWT, async (c) => {
    const user = c.get('user');
    const userId = user.id;
    const body = await c.req.json();
    return c.json(await (0, profile_controller_1.updateProfile)(userId, body));
});
