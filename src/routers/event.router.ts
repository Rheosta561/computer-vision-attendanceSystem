import { Hono } from 'hono'
import { z } from 'zod'

import {
  createEvent,
  getEvent,
  searchEvents,
  updateEvent,
  deleteEvent,
} from '@/controllers/event.controller'
import { ApiError } from '@/utils/ApiError'
import { verifyJWT } from '@/middlewares/auth.middleware'
import { requireFaculty } from '@/middlewares/faculty.middleware'
import { ApiResponse } from '@/utils/ApiResponse'
import { getMyGroupEvents } from '@/controllers/event.controller'
import { getGroupEvents } from '@/controllers/event.controller'

export const eventRouter = new Hono()



const createEventSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  dateTime: z.string(), 
  facultyId: z.string(),
  groupId: z.string(),
  attendeesIds: z.array(z.string()).default([]),
  weightage: z.number().optional(),
})

const updateEventSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  dateTime: z.string().optional(),
  attendeesIds: z.array(z.string()).optional(),
  weightage: z.number().optional(),
})


// creating the event 
eventRouter.get('/my-events', verifyJWT, async c => {
  const user = c.get('user')

  const query = c.req.query('q') || undefined
  const cursor = c.req.query('cursor') || undefined
  const limit = Number(c.req.query('limit') || 10)

  return c.json(await getMyGroupEvents({
    userId: user.id,
    query,
    cursor,
    limit
  }))
})
eventRouter.post('/', verifyJWT , requireFaculty ,  async (c) => {
  try {
    const body = await c.req.json()
    const dto = createEventSchema.parse(body)

    const res = await createEvent(dto)
    return c.json(res)
  } catch (err: any) {
    if (err instanceof Error)
      return c.json(new ApiError(400, err.message), 400)

    return c.json(new ApiError(500, 'Unexpected error'), 500)
  }
})




// get event by Id 

eventRouter.get('/:eventId', verifyJWT ,  async (c) => {
  try {
    const { eventId } = c.req.param()

    const res = await getEvent(eventId)
    return c.json(res)
  } catch (err: any) {
    if (err instanceof ApiError)
      return c.json(err, )

    return c.json(new ApiError(500, 'Unexpected error'), 500)
  }
})


// search the events 
eventRouter.get('/', verifyJWT ,  async (c) => {
  try {
    const query = c.req.query('q')
    const facultyId = c.req.query('facultyId')
    const groupId = c.req.query('groupId')
    const cursor = c.req.query('cursor')
    const limit = Number(c.req.query('limit') ?? 10)

    const res = await searchEvents({
      query,
      facultyId,
      groupId,
      cursor,
      limit,
    })

    return c.json(res, )
  } catch (err: any) {
    return c.json(new ApiError(500, 'Unexpected error'), 500)
  }
})


// updating the event 
eventRouter.patch('/:eventId', verifyJWT , requireFaculty ,  async (c) => {
  try {
    const { eventId } = c.req.param()
    const body = await c.req.json()

    const dto = updateEventSchema.parse(body)

    const res = await updateEvent(eventId, dto)

    return c.json(res)
  } catch (err: any) {
    if (err instanceof ApiError)
      return c.json(err)

    return c.json(new ApiError(500, 'Unexpected error'), 500)
  }
})

// get gropu events 
eventRouter.get(
  "/group/my",
  verifyJWT,
  async (c) => {
    try {
      const user = c.get("user");
      const userId = user.id;

      const { q, cursor, limit } = c.req.query();

      const apiResponse = await getMyGroupEvents({
        userId,
        query: q,
        cursor,
        limit: limit ? Number(limit) : undefined
      });

      return c.json(
        {res: apiResponse}
      );

    } catch (err) {
      console.error("GET /events/group/my ERROR", err);

      return c.json(
        new ApiResponse(
          500,
          null,
          "Failed to fetch group events"
        ),
        { status: 500 }
      );
    }
  }
);




// deleting the event 
eventRouter.delete('/:eventId', verifyJWT , requireFaculty , async (c) => {
  try {
    const { eventId } = c.req.param()

    const res = await deleteEvent(eventId)
    console.log(res);

    return c.json(res)
  } catch (err: any) {
    if (err instanceof ApiError)
      return c.json(err)

    return c.json(new ApiError(500, 'Unexpected error'), 500)
  }
})


// get events of one group 
eventRouter.get('/group/:groupId', verifyJWT, async (c) => {
  try {
    const groupId = c.req.param('groupId')

    const query = c.req.query('q') ?? undefined
    const cursor = c.req.query('cursor') ?? undefined
    const limit = c.req.query('limit')
      ? parseInt(c.req.query('limit')!)
      : 10

    const res = await getGroupEvents({
      groupId,
      query,
      cursor,
      limit
    })

    return c.json(res)

  } catch (err: any) {
    console.error('Group events error', err)

    return c.json(
      new ApiResponse(
        err.statusCode ?? 500,
        null,
        err.message ?? 'Something went wrong'
      ),
      err.statusCode ?? 500
    )
  }
})
