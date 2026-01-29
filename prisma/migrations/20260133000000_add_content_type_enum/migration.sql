DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContentType') THEN
        CREATE TYPE "ContentType" AS ENUM ('legal', 'faq');
    END IF;
END $$;

ALTER TABLE "ContentPage"
ALTER COLUMN "type" TYPE "ContentType" USING "type"::"ContentType";
