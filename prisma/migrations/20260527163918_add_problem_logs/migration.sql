-- CreateEnum
CREATE TYPE "ProblemDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateTable
CREATE TABLE "problem_logs" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "problemTitle" TEXT NOT NULL,
    "problemUrl" TEXT,
    "difficulty" "ProblemDifficulty" NOT NULL,
    "topic" TEXT,
    "timeTakenMinutes" INTEGER,
    "hintsUsed" INTEGER,
    "notes" TEXT,
    "solvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "areaId" TEXT,

    CONSTRAINT "problem_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "problem_logs_userId_solvedAt_idx" ON "problem_logs"("userId", "solvedAt");

-- AddForeignKey
ALTER TABLE "problem_logs" ADD CONSTRAINT "problem_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_logs" ADD CONSTRAINT "problem_logs_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
