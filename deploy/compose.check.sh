#!/usr/bin/env bash
# Valide `compose.yaml` avant de demander le déploiement : Dokploy lit ce fichier dans le dépôt à
# chaque déploiement, donc un fichier invalide fusionné serait déployé tel quel. Les variables
# viennent du modèle `portfolio.env.example`, les vides remplies d'une valeur factice.
#
# Au-delà de la syntaxe, le script affirme le durcissement de la pile sur la configuration résolue
# (`docker compose config`) : un service ajouté ou modifié sans ces garanties arrête le déploiement.
#   deploy/compose.check.sh
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# Deux jeux de variables : sans rôle applicatif (l'API retombe sur le rôle propriétaire, état d'une
# pile où le rôle n'est pas encore créé), puis avec (`POSTGRES_APP_*` décommentées).
sed -E 's/^([A-Z0-9_]+)=$/\1=valeur/' "$HERE/portfolio.env.example" > "$WORK/owner.env"
sed -E 's/^# (POSTGRES_APP_[A-Z_]+=)/\1/; s/^([A-Z0-9_]+)=$/\1=valeur/' \
  "$HERE/portfolio.env.example" > "$WORK/app.env"

config() {
  docker compose --env-file "$1" -f "$HERE/compose.yaml" config --format json
}
config "$WORK/owner.env" > "$WORK/owner.json"
config "$WORK/app.env" > "$WORK/app.json"

python3 - "$WORK/owner.json" "$WORK/app.json" <<'PY'
import json
import sys

with open(sys.argv[1]) as f:
    owner = json.load(f)
with open(sys.argv[2]) as f:
    app = json.load(f)

services = app["services"]
networks = app.get("networks", {})
failures = []


def check(condition, message):
    if not condition:
        failures.append(message)


# Capacités Linux rendues à un service, chacune démontrée nécessaire (deploy/README.md). Tout autre
# service tourne sans aucune capacité.
ALLOWED_CAP_ADD = {"portfolio-web": {"CHOWN", "KILL", "SETGID", "SETUID"}}
# Seul service dont le processus de tête reste root : son script de démarrage lance Node sous
# l'utilisateur `ssr` et nginx sous `nginx`.
ROOT_ENTRYPOINT = {"portfolio-web"}
# Chemins inscriptibles attendus, en mémoire (tmpfs) ou sur volume ; tout le reste est en lecture seule.
EXPECTED_TMPFS = {
    "portfolio-web": {"/etc/nginx/conf.d", "/run"},
    "portfolio-api": {"/tmp"},
    "portfolio-migrate": set(),
    "portfolio-cron": set(),
    "portfolio-db": {"/run/postgresql"},
    "portfolio-backup": set(),
}
EXPECTED_VOLUMES = {
    "portfolio-web": {"/var/cache/nginx"},
    "portfolio-db": {"/var/lib/postgresql/data"},
    "portfolio-backup": {"/tmp"},
}
EXPECTED_NETWORKS = {
    "portfolio-web": {"default", "dokploy-network"},
    "portfolio-api": {"default", "portfolio-db"},
    "portfolio-migrate": {"portfolio-db"},
    "portfolio-cron": {"default"},
    "portfolio-db": {"portfolio-db"},
    "portfolio-backup": {"default", "portfolio-db"},
}

check(
    set(services) == set(EXPECTED_NETWORKS),
    f"services inattendus : {sorted(set(services) ^ set(EXPECTED_NETWORKS))} "
    "(déclarer le nouveau service dans compose.check.sh avec ses garanties)",
)

for name, service in sorted(services.items()):
    check(service.get("read_only") is True, f"{name} : système de fichiers inscriptible (read_only)")
    check(service.get("cap_drop") == ["ALL"], f"{name} : capacités non retirées (cap_drop: [ALL])")
    cap_add = set(service.get("cap_add", []))
    allowed = ALLOWED_CAP_ADD.get(name, set())
    check(cap_add == allowed, f"{name} : cap_add {sorted(cap_add)}, attendu {sorted(allowed)}")
    check(
        "no-new-privileges:true" in service.get("security_opt", []),
        f"{name} : no-new-privileges absent",
    )
    check(not service.get("privileged"), f"{name} : conteneur privilégié")
    check(not service.get("ports"), f"{name} : port publié sur l'hôte")
    for key in ("network_mode", "pid", "ipc", "userns_mode", "devices", "cap_add_all"):
        check(not service.get(key), f"{name} : option `{key}` interdite")
    check(int(service.get("mem_limit", 0)) > 0, f"{name} : pas de limite de mémoire (mem_limit)")
    check(int(service.get("pids_limit", 0)) > 0, f"{name} : pas de limite de processus (pids_limit)")

    user = str(service.get("user", ""))
    if name in ROOT_ENTRYPOINT:
        check(user == "", f"{name} : `user` fixé alors que son démarrage exige root")
    else:
        check(
            user not in ("", "0", "root") and not user.startswith(("0:", "root:")),
            f"{name} : utilisateur root ou implicite (`user`)",
        )

    tmpfs = service.get("tmpfs", [])
    tmpfs = [tmpfs] if isinstance(tmpfs, str) else tmpfs
    tmpfs_paths = {entry.split(":")[0] for entry in tmpfs}
    expected_tmpfs = EXPECTED_TMPFS.get(name, set())
    check(tmpfs_paths == expected_tmpfs, f"{name} : tmpfs {sorted(tmpfs_paths)}, attendu {sorted(expected_tmpfs)}")
    for entry in tmpfs:
        check("size=" in entry, f"{name} : tmpfs sans taille bornée ({entry})")

    mounts = service.get("volumes", [])
    for mount in mounts:
        check(mount.get("type") == "volume", f"{name} : montage de l'hôte ({mount.get('source')})")
    targets = {mount.get("target") for mount in mounts}
    expected_volumes = EXPECTED_VOLUMES.get(name, set())
    check(targets == expected_volumes, f"{name} : volumes {sorted(targets)}, attendu {sorted(expected_volumes)}")

    attached = set(service.get("networks", {}))
    expected_networks = EXPECTED_NETWORKS.get(name, set())
    check(attached == expected_networks, f"{name} : réseaux {sorted(attached)}, attendu {sorted(expected_networks)}")

# La base n'a ni sortie ni voisin hors de l'API, des migrations et de la sauvegarde.
check(networks.get("portfolio-db", {}).get("internal") is True, "réseau portfolio-db : non interne")
check(networks.get("dokploy-network", {}).get("external") is True, "réseau dokploy-network : non externe")

# Sondes existantes conservées.
db_health = services.get("portfolio-db", {}).get("healthcheck", {})
check("pg_isready" in " ".join(db_health.get("test", [])), "portfolio-db : sonde pg_isready absente")
check(
    services.get("portfolio-cron", {}).get("healthcheck", {}).get("disable") is True,
    "portfolio-cron : la sonde héritée de l'image de l'API doit rester désactivée",
)
for name in ("portfolio-web", "portfolio-api"):
    check(
        "healthcheck" not in services.get(name, {}),
        f"{name} : sonde redéfinie (celle de l'image fait foi)",
    )


# Rôles Postgres : les migrations et la sauvegarde gardent le rôle propriétaire ; l'API prend le rôle
# applicatif dès qu'il est renseigné, le rôle propriétaire sinon.
def database_url(config, name):
    environment = config["services"][name]["environment"]
    return environment["DATABASE_URL"]


check(
    database_url(app, "portfolio-api").startswith("postgres://portfolio_app:"),
    "portfolio-api : DATABASE_URL n'utilise pas le rôle applicatif quand POSTGRES_APP_* est renseigné",
)
check(
    database_url(owner, "portfolio-api").startswith("postgres://portfolio:"),
    "portfolio-api : DATABASE_URL ne retombe pas sur le rôle propriétaire sans POSTGRES_APP_*",
)
for config in (app, owner):
    check(
        database_url(config, "portfolio-migrate").startswith("postgres://portfolio:"),
        "portfolio-migrate : les migrations doivent garder le rôle propriétaire",
    )
    check(
        config["services"]["portfolio-backup"]["environment"]["PGUSER"] == "portfolio",
        "portfolio-backup : la sauvegarde doit garder le rôle propriétaire",
    )

if failures:
    print(f"compose.yaml : {len(failures)} garantie(s) de durcissement non tenue(s)", file=sys.stderr)
    for failure in failures:
        print(f"  - {failure}", file=sys.stderr)
    sys.exit(1)

print("compose.yaml valide et durci, services : " + " ".join(sorted(services)))
PY
