import { createGroup, getGroup, updateGroup, deleteGroup, joinGroup, leaveGroup } from '@/controllers/group.controller';
import { verifyJWT } from '@/middlewares/auth.middleware';
import { requireFaculty } from '@/middlewares/faculty.middleware';
import { Hono } from 'hono';
import { getGroupByCode, joinGroupByCode, toggleInvite, getMyGroups, getGroupWithMembers } from '@/controllers/group.controller';
import { removeMember } from '@/controllers/group.controller';
export const groupRouter = new Hono();
groupRouter.get('/me', verifyJWT, async (c) => {
    const user = c.get('user');
    return c.json(await getMyGroups(user.id));
});
groupRouter.post('/', verifyJWT, requireFaculty, async (c) => {
    const body = await c.req.json();
    const user = c.get('user');
    return c.json(await createGroup({
        ...body,
        facultyId: user.id,
    }));
});
groupRouter.get('/:groupId', verifyJWT, async (c) => {
    return c.json(await getGroup(c.req.param('groupId')));
});
groupRouter.patch('/:groupId', verifyJWT, requireFaculty, async (c) => {
    const dto = await c.req.json();
    return c.json(await updateGroup(c.req.param('groupId'), dto));
});
groupRouter.delete('/:groupId', verifyJWT, requireFaculty, async (c) => {
    return c.json(await deleteGroup(c.req.param('groupId')));
});
groupRouter.post('/:groupId/join', verifyJWT, async (c) => {
    const user = c.get('user');
    return c.json(await joinGroup(c.req.param('groupId'), user.id));
});
groupRouter.post('/:groupId/leave', verifyJWT, async (c) => {
    const user = c.get('user');
    return c.json(await leaveGroup(c.req.param('groupId'), user.id));
});
// code routes 
// Join by code
groupRouter.post('/join/:code', verifyJWT, async (c) => {
    const user = c.get('user');
    return c.json(await joinGroupByCode(c.req.param('code'), user.id));
});
// Get group by code
groupRouter.get('/code/:code', verifyJWT, async (c) => {
    return c.json(await getGroupByCode(c.req.param('code')));
});
//toggle invites 
groupRouter.post('/:groupId/toggle-invite', verifyJWT, requireFaculty, async (c) => {
    return c.json(await toggleInvite(c.req.param('groupId')));
});
// export or download the group 
groupRouter.get('/:groupId/export', verifyJWT, requireFaculty, async (c) => {
    return c.json(await getGroupWithMembers(c.req.param('groupId')));
});
groupRouter.post('/:groupId/remove-member', verifyJWT, requireFaculty, async (c) => {
    const { memberId } = await c.req.json();
    return c.json(await removeMember(c.req.param('groupId'), memberId));
});
