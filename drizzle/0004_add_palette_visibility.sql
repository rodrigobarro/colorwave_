-- Every palette so far was created with "Publish", so existing rows start
-- public and count as published when created. Only new rows default to private.
ALTER TABLE "palettes" ADD COLUMN "visibility" text DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "palettes" ALTER COLUMN "visibility" SET DEFAULT 'private';--> statement-breakpoint
ALTER TABLE "palettes" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
UPDATE "palettes" SET "published_at" = "created_at";--> statement-breakpoint
ALTER TABLE "palettes" ADD CONSTRAINT "palettes_visibility_check" CHECK ("palettes"."visibility" in ('public', 'private'));--> statement-breakpoint
ALTER TABLE "palettes" ADD CONSTRAINT "palettes_public_published_check" CHECK ("palettes"."visibility" = 'private' or "palettes"."published_at" is not null);
