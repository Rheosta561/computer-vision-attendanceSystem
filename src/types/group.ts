export interface CreateGroupDTO {
  name: string
  facultyId: string
  members?: string[]
}

export interface UpdateGroupDTO {
  name?: string
  members?: string[]
}
