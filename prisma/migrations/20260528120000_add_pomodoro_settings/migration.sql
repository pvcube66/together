-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN     "pomodoroEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user_settings" ADD COLUMN     "pomodoroFocusMinutes" INTEGER NOT NULL DEFAULT 25;
ALTER TABLE "user_settings" ADD COLUMN     "pomodoroBreakMinutes" INTEGER NOT NULL DEFAULT 5;
