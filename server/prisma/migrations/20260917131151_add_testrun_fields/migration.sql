/*
  Warnings:

  - Added the required column `testId` to the `TestResult` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TestResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testRunId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "expectedType" TEXT NOT NULL,
    "expectedAction" TEXT NOT NULL,
    "actualType" TEXT,
    "actualAction" TEXT,
    "riskScore" INTEGER,
    "passed" BOOLEAN NOT NULL,
    "requestId" TEXT,
    "evidence" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestResult_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "TestRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TestResult" ("actualAction", "actualType", "createdAt", "expectedAction", "expectedType", "id", "passed", "riskScore", "testName", "testRunId") SELECT "actualAction", "actualType", "createdAt", "expectedAction", "expectedType", "id", "passed", "riskScore", "testName", "testRunId" FROM "TestResult";
DROP TABLE "TestResult";
ALTER TABLE "new_TestResult" RENAME TO "TestResult";
CREATE TABLE "new_TestRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mode" TEXT NOT NULL DEFAULT 'IDS',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "totalTests" INTEGER NOT NULL,
    "passed" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "truePositive" INTEGER NOT NULL DEFAULT 0,
    "trueNegative" INTEGER NOT NULL DEFAULT 0,
    "falsePositive" INTEGER NOT NULL DEFAULT 0,
    "falseNegative" INTEGER NOT NULL DEFAULT 0,
    "accuracy" REAL,
    "precision" REAL,
    "recall" REAL,
    "f1Score" REAL,
    "methodology" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_TestRun" ("accuracy", "completedAt", "createdAt", "f1Score", "failed", "falseNegative", "falsePositive", "id", "methodology", "passed", "precision", "recall", "startedAt", "totalTests", "trueNegative", "truePositive") SELECT "accuracy", "completedAt", "createdAt", "f1Score", "failed", "falseNegative", "falsePositive", "id", "methodology", "passed", "precision", "recall", "startedAt", "totalTests", "trueNegative", "truePositive" FROM "TestRun";
DROP TABLE "TestRun";
ALTER TABLE "new_TestRun" RENAME TO "TestRun";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
