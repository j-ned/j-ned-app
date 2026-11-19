CREATE TABLE "login_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"user_id" uuid,
	"browser" text,
	"os" text,
	"country" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "login_event_kind_check" CHECK ("login_event"."kind" IN ('password_accepted', 'password_rejected', 'two_factor_accepted', 'two_factor_rejected'))
);
--> statement-breakpoint
ALTER TABLE "login_event" ADD CONSTRAINT "login_event_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "login_event_created_at_idx" ON "login_event" USING btree ("created_at");