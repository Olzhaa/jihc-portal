-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "edupageId" TEXT;

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "edupageId" TEXT;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "edupageId" TEXT;

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "edupageId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "edupageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Course_edupageId_key" ON "Course"("edupageId");

-- CreateIndex
CREATE UNIQUE INDEX "Group_edupageId_key" ON "Group"("edupageId");

-- CreateIndex
CREATE UNIQUE INDEX "Room_edupageId_key" ON "Room"("edupageId");

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_edupageId_key" ON "Schedule"("edupageId");

-- CreateIndex
CREATE UNIQUE INDEX "User_edupageId_key" ON "User"("edupageId");

