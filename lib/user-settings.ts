import type { PrismaClient } from '@prisma/client';

export type SerializedUserSettings = {
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  compactSidebar: boolean;
  sessionReminders: boolean;
  friendActivity: boolean;
  roomInvites: boolean;
  leaderboardUpdates: boolean;
  soloMode: boolean;
  todoDdayDate: string;
  todoDdayTitle: string;
  todoWeeklyGoal: number;
  todoMonthlyGoal: number;
  pomodoroEnabled: boolean;
  pomodoroFocusMinutes: number;
  pomodoroBreakMinutes: number;
};

export const DEFAULT_USER_SETTINGS: SerializedUserSettings = {
  theme: 'light',
  soundEnabled: true,
  compactSidebar: false,
  sessionReminders: true,
  friendActivity: false,
  roomInvites: true,
  leaderboardUpdates: false,
  soloMode: false,
  todoDdayDate: '2026-06-01',
  todoDdayTitle: 'D-Day milestone',
  todoWeeklyGoal: 12,
  todoMonthlyGoal: 42,
  pomodoroEnabled: false,
  pomodoroFocusMinutes: 25,
  pomodoroBreakMinutes: 5,
};

export function serializeUserSettings(
  settings: {
    theme: 'LIGHT' | 'DARK';
    soundEnabled: boolean;
    compactSidebar: boolean;
    sessionReminders: boolean;
    friendActivity: boolean;
    roomInvites: boolean;
    leaderboardUpdates: boolean;
    soloMode: boolean;
    todoDdayDate: string | null;
    todoDdayTitle: string | null;
    todoWeeklyGoal: number;
    todoMonthlyGoal: number;
    pomodoroEnabled: boolean;
    pomodoroFocusMinutes: number;
    pomodoroBreakMinutes: number;
  } | null,
): SerializedUserSettings {
  if (!settings) return DEFAULT_USER_SETTINGS;
  return {
    theme: settings.theme === 'DARK' ? 'dark' : 'light',
    soundEnabled: settings.soundEnabled,
    compactSidebar: settings.compactSidebar,
    sessionReminders: settings.sessionReminders,
    friendActivity: settings.friendActivity,
    roomInvites: settings.roomInvites,
    leaderboardUpdates: settings.leaderboardUpdates,
    soloMode: settings.soloMode,
    todoDdayDate: settings.todoDdayDate ?? DEFAULT_USER_SETTINGS.todoDdayDate,
    todoDdayTitle: settings.todoDdayTitle ?? '',
    todoWeeklyGoal: settings.todoWeeklyGoal ?? DEFAULT_USER_SETTINGS.todoWeeklyGoal,
    todoMonthlyGoal: settings.todoMonthlyGoal ?? DEFAULT_USER_SETTINGS.todoMonthlyGoal,
    pomodoroEnabled: settings.pomodoroEnabled,
    pomodoroFocusMinutes: settings.pomodoroFocusMinutes,
    pomodoroBreakMinutes: settings.pomodoroBreakMinutes,
  };
}

export async function getOrCreateUserSettings(
  prisma: PrismaClient,
  userId: string,
): Promise<SerializedUserSettings> {
  const select = {
    theme: true,
    soundEnabled: true,
    compactSidebar: true,
    sessionReminders: true,
    friendActivity: true,
    roomInvites: true,
    leaderboardUpdates: true,
    soloMode: true,
    todoDdayDate: true,
    todoDdayTitle: true,
    todoWeeklyGoal: true,
    todoMonthlyGoal: true,
    pomodoroEnabled: true,
    pomodoroFocusMinutes: true,
    pomodoroBreakMinutes: true,
  };

  try {
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
      select,
    });

    if (!settings) {
      try {
        settings = await prisma.userSettings.create({
          data: { userId },
          select,
        });
      } catch (err) {
        // Unique constraint failed because a concurrent request just inserted it
        settings = await prisma.userSettings.findUnique({
          where: { userId },
          select,
        });
        if (!settings) throw err;
      }
    }

    return serializeUserSettings(settings);
  } catch (error) {
    try {
      const settings = await prisma.userSettings.upsert({
        where: { userId },
        update: {},
        create: { userId },
        select,
      });
      return serializeUserSettings(settings);
    } catch {
      return DEFAULT_USER_SETTINGS;
    }
  }
}

// — user-settings.ts: Prisma user_settings ↔ client JSON shape; defaults and upsert helper.
