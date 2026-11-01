# Cibles construites par la CI en une seule passe BuildKit, contexte = racine du monorepo (lockfile
# commun). Côté site, les tests et l'image de production partagent l'étage `source` et se
# construisent en parallèle. Dokploy ne construit rien : il tire les images publiées sur GHCR.

group "web-ci" {
  targets = ["web-test", "web-production"]
}

target "web-test" {
  context    = "."
  dockerfile = "apps/web/Dockerfile"
  target     = "test"
  output     = ["type=cacheonly"]
}

target "web-production" {
  context    = "."
  dockerfile = "apps/web/Dockerfile"
  target     = "production"
  tags       = ["ng-portfolio-app:ci"]
  output     = ["type=docker"]
  # Relie le paquet GHCR au dépôt (visibilité et page du paquet).
  labels = {
    "org.opencontainers.image.source" = "https://github.com/j-ned/j-ned-app"
  }
}

target "api" {
  context    = "."
  dockerfile = "apps/api/Dockerfile"
  tags       = ["nest-portfolio-app:ci"]
  labels = {
    "org.opencontainers.image.source" = "https://github.com/j-ned/j-ned-app"
  }
}
