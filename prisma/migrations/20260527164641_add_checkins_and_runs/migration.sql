-- CreateEnum
CREATE TYPE "RunType" AS ENUM ('EASY', 'TEMPO', 'INTERVAL', 'LONG_RUN', 'RACE');

-- CreateTable
CREATE TABLE "daily_checkins" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "moodScore" INTEGER NOT NULL,
    "energyScore" INTEGER NOT NULL,
    "focusScore" INTEGER NOT NULL,
    "sleepHours" DOUBLE PRECISION,
    "wins" TEXT,
    "blockers" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "areaId" TEXT,

    CONSTRAINT "daily_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "run_logs" (
    "id" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "paceMinPerKm" DOUBLE PRECISION,
    "runType" "RunType" NOT NULL DEFAULT 'EASY',
    "effort" INTEGER,
    "routeName" TEXT,
    "notes" TEXT,
    "runDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "areaId" TEXT,

    CONSTRAINT "run_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_checkins_userId_date_key" ON "daily_checkins"("userId", "date");

-- CreateIndex
CREATE INDEX "run_logs_userId_runDate_idx" ON "run_logs"("userId", "runDate");

-- AddForeignKey
ALTER TABLE "daily_checkins" ADD CONSTRAINT "daily_checkins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_checkins" ADD CONSTRAINT "daily_checkins_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "run_logs" ADD CONSTRAINT "run_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "run_logs" ADD CONSTRAINT "run_logs_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
