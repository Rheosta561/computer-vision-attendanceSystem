import { prisma } from '@/config/prismaClient'
import { ApiError } from '@/utils/ApiError'
import { ApiResponse } from '@/utils/ApiResponse'
import { CreateEventDTO, UpdateEventDTO } from '@/types/event'

// create event controller 
export const createEvent = async (data: CreateEventDTO) => {
  const event = await prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      dateTime: new Date(data.dateTime),
      facultyId: data.facultyId,
      groupId: data.groupId,
      attendeesIds: data.attendeesIds,
      weightage: data.weightage,
    },
  })

  return new ApiResponse(201, event, 'Event created successfully')
}

// getEvent controller 
export const getEvent = async (eventId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  })

  if (!event) throw new ApiError(404, 'Event not found')

  return new ApiResponse(200, event, 'Event fetched successfully')
}


// search event controller (with cursor pagination) faculty id only appliead if prvided in order to fetch faculty's events 
export const searchEvents = async ({
  query,
  facultyId,
  groupId,
  cursor,
  limit = 10
}: {
  query?: string
  facultyId?: string
  groupId?: string
  cursor?: string
  limit?: number
}) => {

  const where: any = { AND: [] }

  if (query?.trim()) {
    where.AND.push({
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    })
  }

  if (facultyId) where.AND.push({ facultyId })
  if (groupId) where.AND.push({ groupId })

  const events = await prisma.event.findMany({
    where: where.AND.length ? where : undefined,
    take: limit + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
  })

  let nextCursor: string | null = null
  let hasMore = false

  if (events.length > limit) {
    const nextItem = events.pop()!
    nextCursor = nextItem.id
    hasMore = true
  }

  return new ApiResponse(
    200,
    { events, nextCursor, hasMore },
    'Events fetched successfully'
  )
}



// /upadate event 
export const updateEvent = async (
  eventId: string,
  data: UpdateEventDTO
) => {
  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      ...data,
      dateTime: data.dateTime ? new Date(data.dateTime) : undefined,
    },
  })

  return new ApiResponse(200, event, 'event updated successfully')
}

//  deleteEvent 
export const deleteEvent = async (eventId: string) => {
  await prisma.event.delete({
    where: { id: eventId },
  })

  return new ApiResponse(200, null, 'event deleted successfully')
}



