-- CreateEnum
CREATE TYPE "FinalPeriod" AS ENUM ('SEMESTER1', 'SEMESTER2', 'YEAR', 'EXAM');

-- CreateTable
CREATE TABLE "FinalGrade" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "academicYear" INTEGER NOT NULL,
    "period" "FinalPeriod" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "manual" BOOLEAN NOT NULL DEFAULT false,
    "setById" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinalGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "FinalGrade_courseId_academicYear_idx" ON "FinalGrade"("courseId", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "FinalGrade_studentId_courseId_academicYear_period_key" ON "FinalGrade"("studentId", "courseId", "academicYear", "period");

-- AddForeignKey
ALTER TABLE "FinalGrade" ADD CONSTRAINT "FinalGrade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalGrade" ADD CONSTRAINT "FinalGrade_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalGrade" ADD CONSTRAINT "FinalGrade_setById_fkey" FOREIGN KEY ("setById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
