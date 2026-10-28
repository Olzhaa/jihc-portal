-- AlterEnum
ALTER TYPE "AttendanceStatus" ADD VALUE 'LEFT_EARLY';

-- AlterEnum
ALTER TYPE "GradeType" ADD VALUE 'ATTENDANCE';

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "snationCode" TEXT;

-- AlterTable
ALTER TABLE "Grade" ADD COLUMN     "assignmentId" TEXT,
ADD COLUMN     "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "workType" TEXT NOT NULL DEFAULT 'simple';

-- AlterTable
ALTER TABLE "Syllabus" ADD COLUMN     "details" JSONB;

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "GradeType" NOT NULL DEFAULT 'CURRENT',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "workType" TEXT NOT NULL DEFAULT 'simple',
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

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
CREATE INDEX "Assignment_courseId_groupId_idx" ON "Assignment"("courseId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonRecord_scheduleId_date_key" ON "LessonRecord"("scheduleId", "date");

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonRecord" ADD CONSTRAINT "LessonRecord_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

