import { createGroup, getGroup, updateGroup, deleteGroup, joinGroup, leaveGroup } from '@/controllers/group.controller'
import { verifyJWT  } from '@/middlewares/auth.middleware'
import { requireFaculty } from '@/middlewares/faculty.middleware'
import { Hono } from 'hono'


export const groupRouter = new Hono();


groupRouter.post('/', verifyJWT, requireFaculty, async c => {
  const body = await c.req.json()
  return c.json(await createGroup(body))
})

groupRouter.get('/:groupId', verifyJWT, async c => {
  return c.json(await getGroup(c.req.param('groupId')))
})

groupRouter.patch('/:groupId', verifyJWT, requireFaculty, async c => {
  const dto = await c.req.json()
  return c.json(await updateGroup(c.req.param('groupId'), dto))
})

groupRouter.delete('/:groupId', verifyJWT, requireFaculty, async c => {
  return c.json(await deleteGroup(c.req.param('groupId')))
})

groupRouter.post('/:groupId/join', verifyJWT, async c => {
  const user = c.get('user')
  return c.json(await joinGroup(c.req.param('groupId'), user.id))
})

groupRouter.post('/:groupId/leave', verifyJWT, async c => {
  const user = c.get('user')
  return c.json(await leaveGroup(c.req.param('groupId'), user.id))
})



