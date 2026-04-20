CREATE TABLE "analytics_event" (
	"id" text PRIMARY KEY NOT NULL,
	"session_hash" text NOT NULL,
	"event_type" text NOT NULL,
	"entity_id" text,
	"entity_title" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_user" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"two_factor_secret" text,
	"is_two_factor_enabled" boolean DEFAULT false NOT NULL,
	"refresh_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "booking" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"start_time" text NOT NULL,
	"duration" integer NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_message" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cv_file" (
	"id" text PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"file_key" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text DEFAULT 'application/pdf' NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cv_file_file_key_unique" UNIQUE("file_key")
);
--> statement-breakpoint
CREATE TABLE "daily_stat" (
	"id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"visitors" integer DEFAULT 0 NOT NULL,
	"pageviews" integer DEFAULT 0 NOT NULL,
	"sessions" integer DEFAULT 0 NOT NULL,
	"bounces" integer DEFAULT 0 NOT NULL,
	"total_duration" integer DEFAULT 0 NOT NULL,
	"project_clicks" integer DEFAULT 0 NOT NULL,
	"article_views" integer DEFAULT 0 NOT NULL,
	"cv_downloads" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_stat_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "diploma" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"provider" text NOT NULL,
	"short_description" text NOT NULL,
	"skills" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disabled_date" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"reason" text,
	CONSTRAINT "disabled_date_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "expertise" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" text DEFAULT 'offer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hero" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tagline" text NOT NULL,
	"availability" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "highlight" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"section" text DEFAULT 'profile' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_view" (
	"id" text PRIMARY KEY NOT NULL,
	"session_hash" text NOT NULL,
	"url" text NOT NULL,
	"referrer" text,
	"browser" text,
	"os" text,
	"country" text,
	"duration" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_info" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"location" text NOT NULL,
	"avatar_url" text DEFAULT '' NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"availability_message" text DEFAULT '' NOT NULL,
	"bio_title" text DEFAULT '' NOT NULL,
	"bio_paragraphs" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"category" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"description" text NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"live_url" text,
	"repo_url" text,
	"repo_url_front" text,
	"repo_url_back" text,
	"featured" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "service_pricing" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"price" text NOT NULL,
	"features" text[] DEFAULT '{}' NOT NULL,
	"highlighted" boolean DEFAULT false NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_link" (
	"id" text PRIMARY KEY NOT NULL,
	"icon" text NOT NULL,
	"label" text NOT NULL,
	"href" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "technology" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"icon" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_analytics_event_type_created" ON "analytics_event" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE INDEX "idx_analytics_event_type_entity" ON "analytics_event" USING btree ("event_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_booking_date" ON "booking" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_booking_created" ON "booking" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_contact_message_read" ON "contact_message" USING btree ("read");--> statement-breakpoint
CREATE INDEX "idx_contact_message_created" ON "contact_message" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_contact_message_read_created" ON "contact_message" USING btree ("read","created_at");--> statement-breakpoint
CREATE INDEX "idx_cv_file_uploaded_at" ON "cv_file" USING btree ("uploaded_at");--> statement-breakpoint
CREATE INDEX "idx_daily_stat_date" ON "daily_stat" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_expertise_type" ON "expertise" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_highlight_section" ON "highlight" USING btree ("section");--> statement-breakpoint
CREATE INDEX "idx_highlight_order" ON "highlight" USING btree ("order");--> statement-breakpoint
CREATE INDEX "idx_page_view_created_at" ON "page_view" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_page_view_session_created" ON "page_view" USING btree ("session_hash","created_at");--> statement-breakpoint
CREATE INDEX "idx_page_view_url_created" ON "page_view" USING btree ("url","created_at");--> statement-breakpoint
CREATE INDEX "idx_project_category" ON "project" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_project_featured" ON "project" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "idx_project_order" ON "project" USING btree ("order");--> statement-breakpoint
CREATE INDEX "idx_service_pricing_order" ON "service_pricing" USING btree ("order");