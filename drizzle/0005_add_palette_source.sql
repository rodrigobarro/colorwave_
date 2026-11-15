-- Every palette with a harmony so far was made from one. Seed palettes predate
-- the editor and keep no source.
ALTER TABLE "palettes" ADD COLUMN "source" text;--> statement-breakpoint
UPDATE "palettes" SET "source" = 'harmony' WHERE "harmony" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "palettes" ADD CONSTRAINT "palettes_source_check" CHECK ("palettes"."source" in ('harmony', 'image'));
