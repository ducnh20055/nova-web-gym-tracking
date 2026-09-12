CREATE TABLE IF NOT EXISTS "routines" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "isCustom" BOOLEAN NOT NULL DEFAULT false,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "routines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "routine_items" (
  "id" TEXT NOT NULL,
  "routineId" TEXT NOT NULL,
  "exerciseId" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "sets" INTEGER NOT NULL DEFAULT 3,
  "reps" INTEGER NOT NULL DEFAULT 10,
  "restSec" INTEGER NOT NULL DEFAULT 60,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "routine_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "workout_log_items" (
  "id" TEXT NOT NULL,
  "workoutLogId" TEXT NOT NULL,
  "exerciseId" TEXT NOT NULL,
  "setNumber" INTEGER NOT NULL,
  "weightKg" DOUBLE PRECISION,
  "repsDone" INTEGER,
  CONSTRAINT "workout_log_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "trainer_sessions" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "title" TEXT NOT NULL DEFAULT 'Trò chuyện mới',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "trainer_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "trainer_messages" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "sender" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "trainer_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT NOT NULL,
  "plan" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "currentPeriodEnd" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_stripeCustomerId_key" ON "subscriptions"("stripeCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");
CREATE INDEX IF NOT EXISTS "subscriptions_userId_idx" ON "subscriptions"("userId");
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions"("status");