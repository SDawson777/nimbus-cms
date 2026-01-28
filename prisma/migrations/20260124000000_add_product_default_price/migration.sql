-- Add missing Product columns
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "defaultPrice" DOUBLE PRECISION;
