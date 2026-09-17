-- Add testRunId to BlockedSource for ownership tracking
ALTER TABLE "BlockedSource" ADD COLUMN "testRunId" TEXT;
