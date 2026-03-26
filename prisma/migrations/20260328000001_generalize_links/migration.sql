-- Drop existing foreign keys from ProjectLink
ALTER TABLE "ProjectLink" DROP CONSTRAINT IF EXISTS "ProjectLink_fromId_fkey";
ALTER TABLE "ProjectLink" DROP CONSTRAINT IF EXISTS "ProjectLink_toId_fkey";

-- Add type columns
ALTER TABLE "ProjectLink" ADD COLUMN "fromType" TEXT NOT NULL DEFAULT 'project';
ALTER TABLE "ProjectLink" ADD COLUMN "toType" TEXT NOT NULL DEFAULT 'project';
