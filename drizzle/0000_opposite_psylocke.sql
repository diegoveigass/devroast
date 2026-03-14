CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint
CREATE TYPE "public"."diff_line_type" AS ENUM('context', 'removed', 'added');--> statement-breakpoint
CREATE TYPE "public"."issue_severity" AS ENUM('critical', 'warning', 'good');--> statement-breakpoint
CREATE TYPE "public"."roast_mode" AS ENUM('honest', 'full_roast');--> statement-breakpoint
CREATE TYPE "public"."roast_verdict" AS ENUM('needs_serious_help', 'rough', 'salvageable', 'solid');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "roast_diff_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"line_type" "diff_line_type" NOT NULL,
	"content" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roast_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"severity" "issue_severity" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roast_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"score" numeric(3, 1) NOT NULL,
	"verdict" "roast_verdict" NOT NULL,
	"headline" text NOT NULL,
	"summary" text NOT NULL,
	"language_label" varchar(64),
	"share_slug" varchar(128) NOT NULL,
	"provider" varchar(64),
	"provider_model" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roast_results_submissionId_unique" UNIQUE("submission_id"),
	CONSTRAINT "roast_results_shareSlug_unique" UNIQUE("share_slug")
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" varchar(64) NOT NULL,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"roast_mode" "roast_mode" DEFAULT 'full_roast' NOT NULL,
	"source" varchar(32) DEFAULT 'web' NOT NULL,
	"language" varchar(64),
	"original_code" text NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"line_count" integer NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"processing_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submissions_publicId_unique" UNIQUE("public_id")
);
--> statement-breakpoint
ALTER TABLE "roast_diff_lines" ADD CONSTRAINT "roast_diff_lines_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roast_issues" ADD CONSTRAINT "roast_issues_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roast_results" ADD CONSTRAINT "roast_results_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "roast_diff_lines_submission_position_idx" ON "roast_diff_lines" USING btree ("submission_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "roast_issues_submission_position_idx" ON "roast_issues" USING btree ("submission_id","position");
