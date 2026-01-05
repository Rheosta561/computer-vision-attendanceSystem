import { prisma } from '@/config/prismaClient'
import { ApiError } from '@/utils/ApiError'
import { ApiResponse } from '@/utils/ApiResponse'
import { CreateGroupDTO, UpdateGroupDTO } from '@/types/group'
import { Prisma } from '@prisma/client'
import { generateGroupCode } from '@/utils/groupCode'


// create group with retry 
export const createGroup = async (data: CreateGroupDTO) => {
  let attempt = 0;

  while (attempt < 5) {
    try {
      const group = await prisma.group.create({
        data: {
          name: data.name,
          facultyId: data.facultyId,
          members: data.members ?? [],
          code: generateGroupCode(),
        },
      });

      return new ApiResponse(201, group, 'Group created successfully');
    }

    catch (err: any) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' // unique constraint failed
      ) {
        attempt++;
        continue; //new code+retyr 
      }

      throw err;
    }
  }

  throw new ApiError(500, 'Could not generate a unique group code');
};



// get group 
export const getGroup = async (groupId: string) => {

  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) throw new ApiError(404, 'Group not found');

  const members = await prisma.user.findMany({
    where: { id: { in: group.members } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return new ApiResponse(
    200,
    {
      group,
      memberDetails : members,
    },
    'Group fetched successfully'
  );
};




// update group 
export const updateGroup = async (
  groupId: string,
  data: UpdateGroupDTO
) => {
  const group = await prisma.group.update({
    where: { id: groupId },
    data,
  });

  const members = await prisma.user.findMany({
    where: { id: { in: group.members } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return new ApiResponse(200, {...group , members}, 'Group updated successfully');
};



// delete group 
export const deleteGroup = async (groupId: string) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) throw new ApiError(400, 'Group already deleted');

  await prisma.group.delete({
    where: { id: groupId },
  });

  return new ApiResponse(200, null, 'Group deleted successfully');
};



// search group 
export const searchGroups = async ({
  query,
  facultyId,
  cursor,
  limit = 10,
}: {
  query?: string;
  facultyId?: string;
  cursor?: string;
  limit?: number;
}) => {
  const where: any = {};

  if (query) {
    where.name = { contains: query, mode: 'insensitive' };
  }

  if (facultyId) {
    where.facultyId = facultyId;
  }

  const groups = await prisma.group.findMany({
    where,
    take: limit + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
  });

  let nextCursor: string | null = null;
  let hasMore = false;

  if (groups.length > limit) {
    const nextItem = groups.pop()!;
    nextCursor = nextItem.id;
    hasMore = true;
  }

  return new ApiResponse(
    200,
    { groups, nextCursor, hasMore },
    'Groups fetched successfully'
  );
};



// join group by ID
export const joinGroup = async (groupId: string, userId: string) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) throw new ApiError(404, 'Group not found');

  if (group.members.includes(userId)) {
    throw new ApiError(400, 'User is already a member of the group');
  }

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: {
      members: {
        push: userId,
      },
    },
  });

  return new ApiResponse(200, updated, 'Joined group successfully');
};



// leave group 
export const leaveGroup = async (groupId: string, userId: string) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) throw new ApiError(404, 'Group not found');

  if (!group.members.includes(userId)) {
    throw new ApiError(400, 'Not in the group');
  }

  const updatedMembers = group.members.filter((m) => m !== userId);

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: { members: updatedMembers },
  });

  return new ApiResponse(200, updated, 'Left group successfully');
};


export const toggleInvite = async (groupId: string) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) throw new ApiError(404, 'Group not found');

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: { inviteEnabled: !group.inviteEnabled },
  });

  return new ApiResponse(
    200,
    updated,
    updated.inviteEnabled ? 'Invite enabled' : 'Invite disabled'
  );
};

export const getGroupWithMembers = async (groupId: string) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) throw new ApiError(404, 'Group not found');

  const members = await prisma.user.findMany({
    where: { id: { in: group.members } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return new ApiResponse(
    200,
    { ...group, members },
    'Group export successful'
  );
};
export const getGroupByCode = async (code: string) => {
  const group = await prisma.group.findUnique({
    where: { code },
  });

  if (!group) throw new ApiError(404, 'Group not found');

  return new ApiResponse(200, group, 'Group fetched successfully');
};


export const joinGroupByCode = async (code: string, userId: string) => {
  const group = await prisma.group.findUnique({
    where: { code },
  });

  if (!group) throw new ApiError(404, 'Group not found');

  if (!group.inviteEnabled)
    throw new ApiError(403, 'Group is closed for joining');

  if (group.members.includes(userId))
    throw new ApiError(400, 'Already a member');

  const updated = await prisma.group.update({
    where: { id: group.id },
    data: { members: { push: userId } },
  });

  return new ApiResponse(200, updated, 'Joined group successfully');
};


//get groups where i am partcipant
export const getMyGroups = async (userId: string) => {
  const groups = await prisma.group.findMany({
    where: {
      OR: [
        { members: { has: userId } },
        { facultyId: userId }
      ]
    },
    orderBy: { createdAt: 'desc' }
  })

  return new ApiResponse(200, groups, 'Fetched user groups')
}

