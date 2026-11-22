-- Commentaires du blog : une table neuve, rien d'existant n'est touché (une image antérieure de l'API
-- l'ignore). La contrainte UNIQUE "blog_comment_thread_key" est créée avec la table, donc avant la clé
-- étrangère composite qui la référence et qui garantit un seul niveau de réponse, sur le même article.
-- Deux statuts seulement : refuser un commentaire, c'est le supprimer, ses réponses avec lui.
CREATE TABLE "blog_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"parent_id" uuid,
	"depth" smallint DEFAULT 0 NOT NULL,
	"parent_depth" smallint,
	"status" text DEFAULT 'pending' NOT NULL,
	"moderated_at" timestamp with time zone,
	"author_kind" text NOT NULL,
	"author_name" text,
	"author_email" text,
	"sender_hash" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_comment_thread_key" UNIQUE("id","post_id","depth"),
	CONSTRAINT "blog_comment_depth_check" CHECK ("blog_comment"."depth" IN (0, 1)),
	CONSTRAINT "blog_comment_depth_parent_check" CHECK (("blog_comment"."parent_id" IS NULL) = ("blog_comment"."depth" = 0)),
	CONSTRAINT "blog_comment_parent_depth_check" CHECK ("blog_comment"."parent_depth" = 0),
	CONSTRAINT "blog_comment_parent_depth_parent_check" CHECK (("blog_comment"."parent_id" IS NULL) = ("blog_comment"."parent_depth" IS NULL)),
	CONSTRAINT "blog_comment_status_check" CHECK ("blog_comment"."status" IN ('pending', 'published')),
	CONSTRAINT "blog_comment_moderated_check" CHECK (("blog_comment"."status" = 'pending') = ("blog_comment"."moderated_at" IS NULL)),
	CONSTRAINT "blog_comment_author_kind_check" CHECK ("blog_comment"."author_kind" IN ('visitor', 'owner')),
	CONSTRAINT "blog_comment_author_identity_check" CHECK (("blog_comment"."author_kind" = 'visitor') = ("blog_comment"."author_name" IS NOT NULL AND "blog_comment"."author_email" IS NOT NULL)),
	CONSTRAINT "blog_comment_owner_anonymous_check" CHECK ("blog_comment"."author_kind" = 'visitor' OR ("blog_comment"."author_name" IS NULL AND "blog_comment"."author_email" IS NULL AND "blog_comment"."sender_hash" IS NULL)),
	CONSTRAINT "blog_comment_owner_published_check" CHECK ("blog_comment"."author_kind" = 'visitor' OR "blog_comment"."status" <> 'pending'),
	CONSTRAINT "blog_comment_author_name_check" CHECK (char_length("blog_comment"."author_name") BETWEEN 2 AND 80),
	CONSTRAINT "blog_comment_author_email_check" CHECK (char_length("blog_comment"."author_email") BETWEEN 3 AND 320),
	CONSTRAINT "blog_comment_body_check" CHECK (char_length("blog_comment"."body") BETWEEN 2 AND 2000)
);
--> statement-breakpoint
ALTER TABLE "blog_comment" ADD CONSTRAINT "blog_comment_post_id_blog_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_comment" ADD CONSTRAINT "blog_comment_parent_fk" FOREIGN KEY ("parent_id","post_id","parent_depth") REFERENCES "public"."blog_comment"("id","post_id","depth") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_comment_post_status_created_idx" ON "blog_comment" USING btree ("post_id","status","created_at");--> statement-breakpoint
CREATE INDEX "blog_comment_parent_idx" ON "blog_comment" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "blog_comment_status_created_idx" ON "blog_comment" USING btree ("status","created_at");