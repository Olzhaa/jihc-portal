-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "curatorId" TEXT;

-- CreateTable
CREATE TABLE "StudentProfile" (
    "studentId" TEXT NOT NULL,
    "birthDate" DATE,
    "gender" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "address" TEXT,
    "siblings" TEXT,
    "activity" TEXT,
    "club" TEXT,
    "hobbies" TEXT[],
    "strongSubjects" TEXT,
    "weakSubjects" TEXT,
    "goal" TEXT,
    "psychNote" TEXT,
    "mbti" TEXT,
    "gallup" TEXT[],
    "gardner" TEXT[],
    "designDirection" TEXT,
    "futurePlan" TEXT,
    "targetUniversity" TEXT,
    "targetSpecialty" TEXT,
    "studyCountries" TEXT[],
    "admissionStatus" TEXT,
    "ieltsScore" DOUBLE PRECISION,
    "ieltsDate" DATE,
    "portfolioUrl" TEXT,
    "practicePlace" TEXT,
    "alumniNow" TEXT,
    "socialStatus" TEXT,
    "parentConsent" BOOLEAN NOT NULL DEFAULT false,
    "homeVisited" BOOLEAN NOT NULL DEFAULT false,
    "homeVisitDate" DATE,
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("studentId")
);

-- CreateTable
CREATE TABLE "Guardian" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT,
    "phone" TEXT,
    "phone2" TEXT,
    "email" TEXT,
    "workplace" TEXT,
    "position" TEXT,
    "familyStatus" TEXT,
    "responsiveness" TEXT,
    "note" TEXT,

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactLog" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "withWhom" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "topics" TEXT[],
    "mood" TEXT,
    "durationMin" DOUBLE PRECISION,
    "discussed" TEXT,
    "agreedStep" TEXT,
    "followUpDate" DATE,
    "agreementDone" BOOLEAN NOT NULL DEFAULT false,
    "notifyParent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuratorTask" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "course" TEXT,
    "logIn" TEXT,
    "source" TEXT,
    "nextDue" DATE,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CuratorTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassEvent" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT,
    "format" TEXT,
    "date" DATE,
    "place" TEXT,
    "status" TEXT NOT NULL,
    "budget" DOUBLE PRECISION,
    "directions" TEXT[],
    "responsibleIds" TEXT[],
    "goal" TEXT,
    "considerations" TEXT,
    "expectedResult" TEXT,
    "analysis" TEXT,
    "feedback" TEXT,
    "parentPermission" BOOLEAN NOT NULL DEFAULT false,
    "parentsAttend" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ClassEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT,
    "level" TEXT,
    "result" TEXT,
    "date" DATE,
    "parentNotified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookRead" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "status" TEXT NOT NULL,
    "language" TEXT,
    "genres" TEXT[],
    "pages" DOUBLE PRECISION,
    "rating" TEXT,
    "startedAt" DATE,
    "finishedAt" DATE,
    "review" TEXT,

    CONSTRAINT "BookRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestResult" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "test" TEXT NOT NULL,
    "date" DATE,
    "conductedBy" TEXT,
    "privacy" TEXT NOT NULL,
    "result" TEXT,
    "discussed" BOOLEAN NOT NULL DEFAULT false,
    "agreedStep" TEXT,

    CONSTRAINT "TestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reflection" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "pride" TEXT NOT NULL,
    "difficulty" TEXT,
    "helpNeeded" TEXT,
    "nextGoal" TEXT,
    "diligence" TEXT NOT NULL,
    "responsibility" TEXT NOT NULL,
    "selfDevelopment" TEXT NOT NULL,
    "designInterest" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reflection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Guardian_studentId_idx" ON "Guardian"("studentId");

-- CreateIndex
CREATE INDEX "ContactLog_studentId_date_idx" ON "ContactLog"("studentId", "date");

-- CreateIndex
CREATE INDEX "CuratorTask_groupId_idx" ON "CuratorTask"("groupId");

-- CreateIndex
CREATE INDEX "ClassEvent_groupId_date_idx" ON "ClassEvent"("groupId", "date");

-- CreateIndex
CREATE INDEX "Achievement_studentId_idx" ON "Achievement"("studentId");

-- CreateIndex
CREATE INDEX "BookRead_studentId_idx" ON "BookRead"("studentId");

-- CreateIndex
CREATE INDEX "TestResult_studentId_idx" ON "TestResult"("studentId");

-- CreateIndex
CREATE INDEX "Reflection_studentId_idx" ON "Reflection"("studentId");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_curatorId_fkey" FOREIGN KEY ("curatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactLog" ADD CONSTRAINT "ContactLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactLog" ADD CONSTRAINT "ContactLog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuratorTask" ADD CONSTRAINT "CuratorTask_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassEvent" ADD CONSTRAINT "ClassEvent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookRead" ADD CONSTRAINT "BookRead_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reflection" ADD CONSTRAINT "Reflection_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
