export interface CreateEventDTO {
  title: string
  description?: string
  dateTime: string        //Iso string 
  facultyId: string      
  groupId: string         
  attendeesIds: string[]
  weightage ?: number
}

export interface UpdateEventDTO {
  title ?: string
  description ?: string
  dateTime? : string
  attendeesIds ?: string[]
  weightage?: number
}
