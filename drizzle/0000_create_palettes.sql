CREATE TABLE "palettes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "palettes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"colors" jsonb NOT NULL,
	"purpose" text DEFAULT 'gradient' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
