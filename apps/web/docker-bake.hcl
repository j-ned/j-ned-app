# Cibles construites par la CI en une seule passe BuildKit : les tests et l'image de production
# partagent l'étage `source` et se construisent en parallèle. Dokploy, lui, ne construit que
# l'étage final du Dockerfile.

group "ci" {
  targets = ["test", "production"]
}

target "test" {
  target = "test"
  output = ["type=cacheonly"]
}

target "production" {
  target = "production"
  tags   = ["ng-portfolio-app:ci"]
  output = ["type=docker"]
  # Relie le paquet GHCR au dépôt (visibilité et page du paquet).
  labels = {
    "org.opencontainers.image.source" = "https://github.com/j-ned/ng-portfolio-app"
  }
}
