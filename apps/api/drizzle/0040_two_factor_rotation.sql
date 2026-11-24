-- Secret TOTP d'une reconfiguration en cours : le secret actif reste valable jusqu'à la confirmation.
-- Ajout seul, nullable : les lignes existantes restent valides, l'ancienne image l'ignore.
ALTER TABLE "users" ADD COLUMN "pending_two_factor_secret" text;