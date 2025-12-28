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
