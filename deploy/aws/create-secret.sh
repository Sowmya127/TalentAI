#!/usr/bin/env bash
# Creates the TalentAI backend secret in AWS Secrets Manager from real values.
# Run this once (and update-secret to rotate). Nothing here is committed with real
# values — you pass them in as args / env so they never touch the repo.
#
#   Usage:
#     DB_PASSWORD='...' JWT_SECRET='...' ./create-secret.sh us-east-1
#
# JWT_SECRET must be >= 32 chars. Generate one with:  openssl rand -base64 48
set -euo pipefail

REGION="${1:-us-east-1}"
SECRET_NAME="talentai/prod/app"
DB_USERNAME="${DB_USERNAME:-talentai_app}"

: "${DB_PASSWORD:?set DB_PASSWORD}"
: "${JWT_SECRET:?set JWT_SECRET (>=32 chars)}"

# Build the JSON payload from env (jq keeps values off the command line/ps output).
PAYLOAD=$(jq -n \
  --arg u "$DB_USERNAME" \
  --arg p "$DB_PASSWORD" \
  --arg j "$JWT_SECRET" \
  '{DB_USERNAME:$u, DB_PASSWORD:$p, JWT_SECRET:$j}')

if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" >/dev/null 2>&1; then
  echo "Secret exists -> updating value"
  aws secretsmanager put-secret-value \
    --secret-id "$SECRET_NAME" --region "$REGION" \
    --secret-string "$PAYLOAD"
else
  echo "Creating secret $SECRET_NAME"
  aws secretsmanager create-secret \
    --name "$SECRET_NAME" --region "$REGION" \
    --description "TalentAI backend secrets (DB + JWT)" \
    --secret-string "$PAYLOAD"
fi

echo "Done. Copy the returned ARN into ecs-task-definition.json (the valueFrom entries)."
