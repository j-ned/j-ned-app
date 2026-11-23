-- L'empreinte de l'IP ne sert qu'au plafond des envois en attente : effacée des commentaires déjà publiés.
UPDATE "blog_comment" SET "sender_hash" = NULL WHERE "status" = 'published' AND "sender_hash" IS NOT NULL;
