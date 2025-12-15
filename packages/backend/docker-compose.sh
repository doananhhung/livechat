#!/bin/bash
# Auto-export UID/GID for docker compose to prevent root-owned files

export UID=$(id -u)
export GID=$(id -g)

echo "Running docker compose with UID=$UID GID=$GID"
docker compose "$@"
