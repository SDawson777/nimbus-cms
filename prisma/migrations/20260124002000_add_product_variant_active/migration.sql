-- Add missing ProductVariant columns for schema parity
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
