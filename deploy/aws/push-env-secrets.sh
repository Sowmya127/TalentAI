#!/usr/bin/env bash
# Pushes the local secret values (Backend/.env.local) into AWS Secrets Manager,
# so you don't retype them. Reads the file, exports the secret keys, and calls
# create-secret.sh. Values never appear on the command line or in the repo.
#
#   Usage:  deploy/aws/push-env-secrets.sh [region]
set -euo pipefail

REGION="${1:-us-east-1}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_LOCAL="$SCRIPT_DIR/../../Backend/.env.local"

if [[ ! -f "$ENV_LOCAL" ]]; then
  echo "Not found: $ENV_LOCAL — create it from Backend/.env.local.example first." >&2
  exit 1
fi

# Load the secret keys from .env.local into this shell only.
set -a
# shellcheck disable=SC1090
source "$ENV_LOCAL"
set +a

DB_USERNAME="${DB_USERNAME:-talentai_app}" \
DB_PASSWORD="${DB_PASSWORD:?DB_PASSWORD missing in .env.local}" \
JWT_SECRET="${JWT_SECRET:?JWT_SECRET missing in .env.local}" \
  "$SCRIPT_DIR/create-secret.sh" "$REGION"
