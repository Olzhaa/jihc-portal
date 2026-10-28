-- AlterEnum
ALTER TYPE "AttendanceStatus" ADD VALUE 'LEFT_EARLY';

-- AlterEnum
ALTER TYPE "GradeType" ADD VALUE 'ATTENDANCE';

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "snationCode" TEXT;

-- AlterTable
ALTER TABLE "Grade" ADD COLUMN     "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "workType" TEXT NOT NULL DEFAULT 'simple';

-- CreateTable
CREATE TABLE "LessonRecord" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "topic" TEXT,
    "homework" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LessonRecord_scheduleId_date_key" ON "LessonRecord"("scheduleId", "date");

-- AddForeignKey
ALTER TABLE "LessonRecord" ADD CONSTRAINT "LessonRecord_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

