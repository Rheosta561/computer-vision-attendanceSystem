import { prisma } from '@/config/prismaClient'
import { ApiError } from '@/utils/ApiError'
import { ApiResponse } from '@/utils/ApiResponse'
import { CreateGroupDTO, UpdateGroupDTO } from '@/types/group'


// create grp 
export const createGroup = async (data: CreateGroupDTO) => {
  const group = await prisma.group.create({
    data: {
      name: data.name,
      facultyId: data.facultyId,
      members: data.members ?? [],
    },
  })

  return new ApiResponse(201, group, 'Group created successfully')
}


// get grp
export const getGroup = async (groupId: string) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  })

  if (!group) throw new ApiError(404, 'Group not found')

  return new ApiResponse(200, group, 'Group fetched successfully')
}


// update grp 
export const updateGroup = async (
  groupId: string,
  data: UpdateGroupDTO
) => {
  const group = await prisma.group.update({
    where: { id: groupId },
    data,
  })

  return new ApiResponse(200, group, 'Group updated successfully')
}


// delete group 
export const deleteGroup = async (groupId: string) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  })

  if (!group) {
    throw new ApiError(400, 'Group already deleted')
  }
  await prisma.group.delete({
    where: { id: groupId },
  })

  return new ApiResponse(200, null, 'Group deleted successfully')
}

// search grp
export const searchGroups = async ({
  query,
  facultyId,
  cursor,
  limit = 10
}: {
  query?: string
  facultyId?: string
  cursor?: string
  limit?: number
}) => {

  const where: any = {}

  // search by name
  if (query) {
    where.name = { contains: query, mode: 'insensitive' }
  }

  // optionally filter by faculty
  if (facultyId) {
    where.facultyId = facultyId
  }

  const groups = await prisma.group.findMany({
    where,
    take: limit + 1,                     // fetch 1 extra to detect next page
    skip: cursor ? 1 : 0,                // skip cursor row
    cursor: cursor ? { id: cursor } : undefined,
  })

  let nextCursor: string | null = null
  let hasMore = false

  if (groups.length > limit) {
    const nextItem = groups.pop()!      // remove extra item
    nextCursor = nextItem.id
    hasMore = true
  }

  return new ApiResponse(
    200,
    { groups, nextCursor, hasMore },
    'Groups fetched successfully'
  )
}


// joing roup
export const joinGroup = async (groupId: string, userId: string) => {
  const group = await prisma.group.findUnique({
    where :{ id: groupId}
  });
  if(group?.members.includes(userId)){
    throw new ApiError(400  , 'User is already a member of the group '); 
  }

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: {
      members: {
        push: userId,
      },
    },
  })
  

  return new ApiResponse(200, updated, 'Joined group successfully')
}


// leave group 
export const leaveGroup = async (groupId: string, userId: string) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  })

  if(!group?.members.includes(userId)){
    throw new ApiError(400 , 'Not in the group ');
  }

  if (!group) throw new ApiError(404, 'Group not found')

  const updatedMembers = group.members.filter(m => m !== userId)

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: { members: updatedMembers },
  })

  return new ApiResponse(200, updated, 'Left group successfully')
}
