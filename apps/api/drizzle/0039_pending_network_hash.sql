-- Empreinte du réseau de l'expéditeur (IPv4 /24, IPv6 /48) : plafond des envois en attente par réseau.
-- Ajout seul, nullable : les lignes existantes restent valides, l'ancienne image l'ignore.
ALTER TABLE "blog_comment" ADD COLUMN "sender_network_hash" text;