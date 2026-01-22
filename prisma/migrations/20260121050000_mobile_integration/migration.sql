-- Mobile Integration Migration (Additive Only)
-- This migration adds missing enums and tables for mobile app support
-- Safe to run on databases where some objects may already exist

-- ==========================================
-- ENUMS (with IF NOT EXISTS pattern via DO blocks)
-- ==========================================

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccessibilityTextSize') THEN
        CREATE TYPE "AccessibilityTextSize" AS ENUM ('system', 'sm', 'md', 'lg', 'xl');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContentType') THEN
        CREATE TYPE "ContentType" AS ENUM ('legal', 'faq');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderPaymentMethod') THEN
        CREATE TYPE "OrderPaymentMethod" AS ENUM ('pay_at_pickup', 'card');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductCategory') THEN
        CREATE TYPE "ProductCategory" AS ENUM ('Flower', 'PreRoll', 'Edibles', 'Vape', 'Concentrate', 'Beverage', 'Tincture', 'Topical', 'Gear', 'Other');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StrainType') THEN
        CREATE TYPE "StrainType" AS ENUM ('Sativa', 'Indica', 'Hybrid', 'CBD', 'None');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DiscountType') THEN
        CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ComplianceRuleType') THEN
        CREATE TYPE "ComplianceRuleType" AS ENUM ('PURCHASE_LIMIT', 'AGE_REQUIREMENT', 'HOURS_OF_OPERATION', 'ID_VERIFICATION');
    END IF;
END $$;

-- Update AdminRole enum if missing values (add BRAND_ADMIN, STORE_MANAGER)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'BRAND_ADMIN' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AdminRole')) THEN
        ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'BRAND_ADMIN';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'STORE_MANAGER' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AdminRole')) THEN
        ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'STORE_MANAGER';
    END IF;
END $$;

-- ==========================================
-- TABLES (with IF NOT EXISTS)
-- ==========================================

-- Brand table
CREATE TABLE IF NOT EXISTS "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#16A34A',
    "secondaryColor" TEXT NOT NULL DEFAULT '#15803D',
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Brand_slug_key" ON "Brand"("slug");
CREATE INDEX IF NOT EXISTS "Brand_slug_idx" ON "Brand"("slug");

-- AccessibilitySetting table
CREATE TABLE IF NOT EXISTS "AccessibilitySetting" (
    "userId" TEXT NOT NULL,
    "textSize" "AccessibilityTextSize" NOT NULL DEFAULT 'system',
    "highContrast" BOOLEAN NOT NULL DEFAULT false,
    "reduceMotion" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "AccessibilitySetting_pkey" PRIMARY KEY ("userId")
);

-- Address table
CREATE TABLE IF NOT EXISTS "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Address_userId_idx" ON "Address"("userId");

-- Article table
CREATE TABLE IF NOT EXISTS "Article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Article_slug_key" ON "Article"("slug");
CREATE INDEX IF NOT EXISTS "Article_category_locale_isPublished_idx" ON "Article"("category", "locale", "isPublished");

-- Award table
CREATE TABLE IF NOT EXISTS "Award" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "redeemedAt" TIMESTAMP(3),
    "iconUrl" TEXT,
    "earnedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Award_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Award_status_idx" ON "Award"("status");
CREATE INDEX IF NOT EXISTS "Award_userId_idx" ON "Award"("userId");

-- ComplianceRule table
CREATE TABLE IF NOT EXISTS "ComplianceRule" (
    "id" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "maxDailyTHCMg" DOUBLE PRECISION NOT NULL,
    "mustVerifyAge" BOOLEAN NOT NULL DEFAULT true,
    "minAge" INTEGER NOT NULL DEFAULT 21,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComplianceRule_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ComplianceRule_stateCode_key" ON "ComplianceRule"("stateCode");
CREATE INDEX IF NOT EXISTS "ComplianceRule_stateCode_idx" ON "ComplianceRule"("stateCode");

-- Coupon table
CREATE TABLE IF NOT EXISTS "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "discountType" TEXT NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "minPurchase" DOUBLE PRECISION,
    "maxDiscount" DOUBLE PRECISION,
    "applicableCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" TEXT NOT NULL DEFAULT 'promo',
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Coupon_code_key" ON "Coupon"("code");
CREATE INDEX IF NOT EXISTS "Coupon_code_idx" ON "Coupon"("code");
CREATE INDEX IF NOT EXISTS "Coupon_isActive_idx" ON "Coupon"("isActive");

-- DataExport table
CREATE TABLE IF NOT EXISTS "DataExport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "downloadUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DataExport_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "DataExport_status_idx" ON "DataExport"("status");
CREATE INDEX IF NOT EXISTS "DataExport_userId_idx" ON "DataExport"("userId");

-- Favorite table
CREATE TABLE IF NOT EXISTS "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "folderId" TEXT,
    "notes" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Favorite_userId_productId_key" ON "Favorite"("userId", "productId");
CREATE INDEX IF NOT EXISTS "Favorite_folderId_idx" ON "Favorite"("folderId");
CREATE INDEX IF NOT EXISTS "Favorite_userId_idx" ON "Favorite"("userId");

-- FavoriteFolder table
CREATE TABLE IF NOT EXISTS "FavoriteFolder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#7C3AED',
    "icon" TEXT NOT NULL DEFAULT 'star',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FavoriteFolder_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FavoriteFolder_userId_name_key" ON "FavoriteFolder"("userId", "name");
CREATE INDEX IF NOT EXISTS "FavoriteFolder_userId_idx" ON "FavoriteFolder"("userId");

-- JournalEntry table
CREATE TABLE IF NOT EXISTS "JournalEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "rating" INTEGER,
    "notes" TEXT,
    "mood" TEXT,
    "effects" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "JournalEntry_productId_idx" ON "JournalEntry"("productId");
CREATE INDEX IF NOT EXISTS "JournalEntry_userId_idx" ON "JournalEntry"("userId");
CREATE INDEX IF NOT EXISTS "JournalEntry_userId_createdAt_idx" ON "JournalEntry"("userId", "createdAt");

-- LoyaltyTransaction table
CREATE TABLE IF NOT EXISTS "LoyaltyTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "LoyaltyTransaction_orderId_idx" ON "LoyaltyTransaction"("orderId");
CREATE INDEX IF NOT EXISTS "LoyaltyTransaction_userId_createdAt_idx" ON "LoyaltyTransaction"("userId", "createdAt");

-- Referral table
CREATE TABLE IF NOT EXISTS "Referral" (
    "id" TEXT NOT NULL,
    "referrerUserId" TEXT NOT NULL,
    "refereeUserId" TEXT,
    "refereeEmail" TEXT,
    "refereePhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Referral_refereeUserId_idx" ON "Referral"("refereeUserId");
CREATE INDEX IF NOT EXISTS "Referral_referrerUserId_idx" ON "Referral"("referrerUserId");
CREATE INDEX IF NOT EXISTS "Referral_status_idx" ON "Referral"("status");

-- Reward table
CREATE TABLE IF NOT EXISTS "Reward" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pointsCost" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,
    "minTier" TEXT,
    "expiresAfterRedemption" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Reward_category_idx" ON "Reward"("category");
CREATE INDEX IF NOT EXISTS "Reward_isActive_idx" ON "Reward"("isActive");

-- RewardRedemption table
CREATE TABLE IF NOT EXISTS "RewardRedemption" (
    "id" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    CONSTRAINT "RewardRedemption_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "RewardRedemption_code_key" ON "RewardRedemption"("code");
CREATE INDEX IF NOT EXISTS "RewardRedemption_rewardId_idx" ON "RewardRedemption"("rewardId");
CREATE INDEX IF NOT EXISTS "RewardRedemption_status_idx" ON "RewardRedemption"("status");

-- StoreProduct table
CREATE TABLE IF NOT EXISTS "StoreProduct" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "price" DOUBLE PRECISION,
    "stock" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "StoreProduct_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "StoreProduct_storeId_productId_variantId_key" ON "StoreProduct"("storeId", "productId", "variantId");
CREATE INDEX IF NOT EXISTS "StoreProduct_productId_idx" ON "StoreProduct"("productId");
CREATE INDEX IF NOT EXISTS "StoreProduct_storeId_idx" ON "StoreProduct"("storeId");

-- UserCoupon table
CREATE TABLE IF NOT EXISTS "UserCoupon" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "isClipped" BOOLEAN NOT NULL DEFAULT false,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "clippedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserCoupon_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserCoupon_userId_couponId_key" ON "UserCoupon"("userId", "couponId");
CREATE INDEX IF NOT EXISTS "UserCoupon_userId_idx" ON "UserCoupon"("userId");

-- UserDataPreference table
CREATE TABLE IF NOT EXISTS "UserDataPreference" (
    "userId" TEXT NOT NULL,
    "personalizedAds" BOOLEAN NOT NULL DEFAULT false,
    "emailTracking" BOOLEAN NOT NULL DEFAULT false,
    "shareWithPartners" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserDataPreference_pkey" PRIMARY KEY ("userId")
);

-- ==========================================
-- ALTER TABLES (add missing columns safely)
-- ==========================================

-- Add brandId to Store if not exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Store' AND column_name = 'brandId') THEN
        ALTER TABLE "Store" ADD COLUMN "brandId" TEXT;
    END IF;
END $$;

-- Add brandId to Product if not exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'brandId') THEN
        ALTER TABLE "Product" ADD COLUMN "brandId" TEXT;
    END IF;
END $$;

-- Add category to Product if not exists (using enum)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'category') THEN
        ALTER TABLE "Product" ADD COLUMN "category" "ProductCategory" NOT NULL DEFAULT 'Other';
    END IF;
END $$;

-- Add strainType to Product if not exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'strainType') THEN
        ALTER TABLE "Product" ADD COLUMN "strainType" "StrainType" NOT NULL DEFAULT 'None';
    END IF;
END $$;

-- Add terpenes to Product if not exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'terpenes') THEN
        ALTER TABLE "Product" ADD COLUMN "terpenes" TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
END $$;

-- Add purchasesLast30d to Product if not exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'purchasesLast30d') THEN
        ALTER TABLE "Product" ADD COLUMN "purchasesLast30d" INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Add paymentMethod to Order if not exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'paymentMethod') THEN
        ALTER TABLE "Order" ADD COLUMN "paymentMethod" "OrderPaymentMethod" NOT NULL DEFAULT 'pay_at_pickup';
    END IF;
END $$;

-- Add delivery fields to Order if not exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'deliveryAddress') THEN
        ALTER TABLE "Order" ADD COLUMN "deliveryAddress" TEXT;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'deliveryNotes') THEN
        ALTER TABLE "Order" ADD COLUMN "deliveryNotes" TEXT;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'deliveryFee') THEN
        ALTER TABLE "Order" ADD COLUMN "deliveryFee" DOUBLE PRECISION;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'tipAmount') THEN
        ALTER TABLE "Order" ADD COLUMN "tipAmount" DOUBLE PRECISION;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'scheduledFor') THEN
        ALTER TABLE "Order" ADD COLUMN "scheduledFor" TIMESTAMP(3);
    END IF;
END $$;

-- Add mobile fields to User if not exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'fcmToken') THEN
        ALTER TABLE "User" ADD COLUMN "fcmToken" TEXT;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'avatarUrl') THEN
        ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'dateOfBirth') THEN
        ALTER TABLE "User" ADD COLUMN "dateOfBirth" TIMESTAMP(3);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'ageVerified') THEN
        ALTER TABLE "User" ADD COLUMN "ageVerified" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'state') THEN
        ALTER TABLE "User" ADD COLUMN "state" TEXT;
    END IF;
END $$;

-- Add store delivery fields if not exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Store' AND column_name = 'isDeliveryEnabled') THEN
        ALTER TABLE "Store" ADD COLUMN "isDeliveryEnabled" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Store' AND column_name = 'isPickupEnabled') THEN
        ALTER TABLE "Store" ADD COLUMN "isPickupEnabled" BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Store' AND column_name = 'deliveryRadius') THEN
        ALTER TABLE "Store" ADD COLUMN "deliveryRadius" DOUBLE PRECISION;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Store' AND column_name = 'deliveryFee') THEN
        ALTER TABLE "Store" ADD COLUMN "deliveryFee" DOUBLE PRECISION;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Store' AND column_name = 'minOrderAmount') THEN
        ALTER TABLE "Store" ADD COLUMN "minOrderAmount" DOUBLE PRECISION;
    END IF;
END $$;

-- ==========================================
-- FOREIGN KEYS (add if not exists)
-- ==========================================

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AccessibilitySetting_userId_fkey') THEN
        ALTER TABLE "AccessibilitySetting" ADD CONSTRAINT "AccessibilitySetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Address_userId_fkey') THEN
        ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Award_userId_fkey') THEN
        ALTER TABLE "Award" ADD CONSTRAINT "Award_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'DataExport_userId_fkey') THEN
        ALTER TABLE "DataExport" ADD CONSTRAINT "DataExport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Favorite_userId_fkey') THEN
        ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Favorite_folderId_fkey') THEN
        ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "FavoriteFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FavoriteFolder_userId_fkey') THEN
        ALTER TABLE "FavoriteFolder" ADD CONSTRAINT "FavoriteFolder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'JournalEntry_userId_fkey') THEN
        ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'JournalEntry_productId_fkey') THEN
        ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'RewardRedemption_rewardId_fkey') THEN
        ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'StoreProduct_storeId_fkey') THEN
        ALTER TABLE "StoreProduct" ADD CONSTRAINT "StoreProduct_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'StoreProduct_productId_fkey') THEN
        ALTER TABLE "StoreProduct" ADD CONSTRAINT "StoreProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'StoreProduct_variantId_fkey') THEN
        ALTER TABLE "StoreProduct" ADD CONSTRAINT "StoreProduct_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'UserCoupon_userId_fkey') THEN
        ALTER TABLE "UserCoupon" ADD CONSTRAINT "UserCoupon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'UserCoupon_couponId_fkey') THEN
        ALTER TABLE "UserCoupon" ADD CONSTRAINT "UserCoupon_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'UserDataPreference_userId_fkey') THEN
        ALTER TABLE "UserDataPreference" ADD CONSTRAINT "UserDataPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Store_brandId_fkey') THEN
        ALTER TABLE "Store" ADD CONSTRAINT "Store_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Product_brandId_fkey') THEN
        ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
