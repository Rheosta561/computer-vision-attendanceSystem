-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "members" TEXT[],

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);
