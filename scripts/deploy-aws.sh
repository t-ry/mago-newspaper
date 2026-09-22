#!/usr/bin/env bash
set -euo pipefail

aws_cli="${AWS_CLI:-aws}"
profile="${AWS_PROFILE:-mago}"
region="ap-northeast-1"
account_id="372387410740"
registry="${account_id}.dkr.ecr.${region}.amazonaws.com"
image="${registry}/mago-newspaper-api:latest"
service_arn="arn:aws:apprunner:${region}:${account_id}:service/mago-newspaper-api/5b39378657d94cee94a77f044c542609"
app_id="d2lslwov00yd74"

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT
chmod 700 "$tmp_dir"
printf '{}\n' > "$tmp_dir/config.json"

"$aws_cli" sts get-caller-identity --profile "$profile" >/dev/null
"$aws_cli" ecr get-login-password --region "$region" --profile "$profile" \
  > "$tmp_dir/ecr-password"
chmod 600 "$tmp_dir/ecr-password"
DOCKER_CONFIG="$tmp_dir" docker login --username AWS --password-stdin "$registry" \
  < "$tmp_dir/ecr-password"

docker build -t mago-newspaper:aws .
docker tag mago-newspaper:aws "$image"
DOCKER_CONFIG="$tmp_dir" docker push "$image"
"$aws_cli" apprunner start-deployment \
  --service-arn "$service_arn" \
  --region "$region" \
  --profile "$profile" >/dev/null

npm run build
python3 -c "import shutil; shutil.make_archive('$tmp_dir/amplify', 'zip', 'dist')"
"$aws_cli" amplify create-deployment \
  --app-id "$app_id" \
  --branch-name main \
  --region "$region" \
  --profile "$profile" \
  --output json > "$tmp_dir/deployment.json"
node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync(process.argv[1]));fetch(d.zipUploadUrl,{method:'PUT',body:fs.readFileSync(process.argv[2])}).then(r=>{if(!r.ok)throw new Error('upload '+r.status)})" \
  "$tmp_dir/deployment.json" "$tmp_dir/amplify.zip"
job_id="$(node -e "console.log(require(process.argv[1]).jobId)" "$tmp_dir/deployment.json")"
"$aws_cli" amplify start-deployment \
  --app-id "$app_id" \
  --branch-name main \
  --job-id "$job_id" \
  --region "$region" \
  --profile "$profile" >/dev/null

echo "Deployments started: https://main.d2lslwov00yd74.amplifyapp.com"
