-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'wellness',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "reminderTime" TEXT NOT NULL,
    "daysOfWeek" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringInterval" INTEGER,
    "recurringEndTime" TEXT,
    "recurringStartTime" TEXT,
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "soundFile" TEXT,
    "vibrationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "snoozeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "snoozeDuration" INTEGER NOT NULL DEFAULT 5,
    "maxSnoozes" INTEGER NOT NULL DEFAULT 3,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reminder_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snoozeCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "metadata" TEXT,
    "userId" TEXT NOT NULL,
    "reminderId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    CONSTRAINT "reminder_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reminder_logs_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "reminders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "counters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'count',
    "iconName" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "dailyGoal" INTEGER,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "date" TEXT NOT NULL,
    "reminderId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "counters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "counters_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "reminders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "reminder_logs_userId_date_idx" ON "reminder_logs"("userId", "date");

-- CreateIndex
CREATE INDEX "reminder_logs_reminderId_date_idx" ON "reminder_logs"("reminderId", "date");

-- CreateIndex
CREATE INDEX "counters_userId_date_idx" ON "counters"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "counters_userId_name_date_key" ON "counters"("userId", "name", "date");
