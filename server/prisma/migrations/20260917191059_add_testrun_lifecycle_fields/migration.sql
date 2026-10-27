-- Add runId and status to TestRun
ALTER TABLE "TestRun" ADD COLUMN "runId" TEXT;
ALTER TABLE "TestRun" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'CREATED';

-- Add runId to SecurityEvent for safe cleanup
ALTER TABLE "SecurityEvent" ADD COLUMN "runId" TEXT;

-- Add runId to TrafficEvent for safe cleanup
ALTER TABLE "TrafficEvent" ADD COLUMN "runId" TEXT;
