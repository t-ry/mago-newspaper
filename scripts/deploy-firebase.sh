#!/usr/bin/env bash
set -euo pipefail

project_id="${1:-}"
region="asia-northeast1"
service="mago-newspaper-api"
secret="orcarouter-api-key"

if [[ -z "$project_id" ]]; then
  echo "Usage: npm run deploy:firebase -- <project-id>" >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo ".env is required." >&2
  exit 1
fi

secret_file="$(mktemp)"
trap 'rm -f "$secret_file"' EXIT
chmod 600 "$secret_file"
node --env-file=.env -e 'process.stdout.write(process.env.ORCAROUTER_API_KEY || "")' > "$secret_file"
if [[ ! -s "$secret_file" ]]; then
  echo "ORCAROUTER_API_KEY is not configured in .env." >&2
  exit 1
fi

gcloud config set project "$project_id"
gcloud services enable \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com

if gcloud secrets describe "$secret" >/dev/null 2>&1; then
  gcloud secrets versions add "$secret" --data-file="$secret_file"
else
  gcloud secrets create "$secret" \
    --replication-policy=automatic \
    --data-file="$secret_file"
fi

gcloud run deploy "$service" \
  --source . \
  --project "$project_id" \
  --region "$region" \
  --allow-unauthenticated \
  --max-instances 1 \
  --memory 1Gi \
  --timeout 120 \
  --set-env-vars ORCAROUTER_MODEL=openai/gpt-4o-mini,PUBLIC_ORIGIN="https://${project_id}.web.app" \
  --set-secrets ORCAROUTER_API_KEY="$secret":latest

npm run build
npm_config_cache=/tmp/mago-firebase-npx \
  npx -y firebase-tools@latest deploy \
  --only hosting \
  --project "$project_id"
