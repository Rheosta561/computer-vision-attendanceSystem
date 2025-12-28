-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "facultyId" TEXT NOT NULL,
    "attendeesIds" TEXT[],
    "groupId" TEXT NOT NULL,
    "weightage" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);
