"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupRouter = void 0;
const group_controller_1 = require("../controllers/group.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const faculty_middleware_1 = require("../middlewares/faculty.middleware");
const hono_1 = require("hono");
const group_controller_2 = require("../controllers/group.controller");
const group_controller_3 = require("../controllers/group.controller");
exports.groupRouter = new hono_1.Hono();
exports.groupRouter.get('/me', auth_middleware_1.verifyJWT, async (c) => {
    const user = c.get('user');
    return c.json(await (0, group_controller_2.getMyGroups)(user.id));
});
exports.groupRouter.post('/', auth_middleware_1.verifyJWT, faculty_middleware_1.requireFaculty, async (c) => {
    const body = await c.req.json();
    const user = c.get('user');
    return c.json(await (0, group_controller_1.createGroup)({
        ...body,
        facultyId: user.id,
    }));
});
exports.groupRouter.get('/:groupId', auth_middleware_1.verifyJWT, async (c) => {
    return c.json(await (0, group_controller_1.getGroup)(c.req.param('groupId')));
});
exports.groupRouter.patch('/:groupId', auth_middleware_1.verifyJWT, faculty_middleware_1.requireFaculty, async (c) => {
    const dto = await c.req.json();
    return c.json(await (0, group_controller_1.updateGroup)(c.req.param('groupId'), dto));
});
exports.groupRouter.delete('/:groupId', auth_middleware_1.verifyJWT, faculty_middleware_1.requireFaculty, async (c) => {
    return c.json(await (0, group_controller_1.deleteGroup)(c.req.param('groupId')));
});
exports.groupRouter.post('/:groupId/join', auth_middleware_1.verifyJWT, async (c) => {
    const user = c.get('user');
    return c.json(await (0, group_controller_1.joinGroup)(c.req.param('groupId'), user.id));
});
exports.groupRouter.post('/:groupId/leave', auth_middleware_1.verifyJWT, async (c) => {
    const user = c.get('user');
    return c.json(await (0, group_controller_1.leaveGroup)(c.req.param('groupId'), user.id));
});
// code routes 
// Join by code
exports.groupRouter.post('/join/:code', auth_middleware_1.verifyJWT, async (c) => {
    const user = c.get('user');
    return c.json(await (0, group_controller_2.joinGroupByCode)(c.req.param('code'), user.id));
});
// Get group by code
exports.groupRouter.get('/code/:code', auth_middleware_1.verifyJWT, async (c) => {
    return c.json(await (0, group_controller_2.getGroupByCode)(c.req.param('code')));
});
//toggle invites 
exports.groupRouter.post('/:groupId/toggle-invite', auth_middleware_1.verifyJWT, faculty_middleware_1.requireFaculty, async (c) => {
    return c.json(await (0, group_controller_2.toggleInvite)(c.req.param('groupId')));
});
// export or download the group 
exports.groupRouter.get('/:groupId/export', auth_middleware_1.verifyJWT, faculty_middleware_1.requireFaculty, async (c) => {
    return c.json(await (0, group_controller_2.getGroupWithMembers)(c.req.param('groupId')));
});
exports.groupRouter.post('/:groupId/remove-member', auth_middleware_1.verifyJWT, faculty_middleware_1.requireFaculty, async (c) => {
    const { memberId } = await c.req.json();
    return c.json(await (0, group_controller_3.removeMember)(c.req.param('groupId'), memberId));
});
