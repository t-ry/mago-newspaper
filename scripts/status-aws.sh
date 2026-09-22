#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$script_dir/find-aws-cli.sh"
aws_cli="$(find_aws_cli)"
profile="${AWS_PROFILE:-mago}"
region="ap-northeast-1"
service_arn="arn:aws:apprunner:${region}:372387410740:service/mago-newspaper-api/5b39378657d94cee94a77f044c542609"

status="$("$aws_cli" apprunner describe-service \
  --service-arn "$service_arn" \
  --region "$region" \
  --profile "$profile" \
  --query 'Service.Status' \
  --output text)"
service_url="$("$aws_cli" apprunner describe-service \
  --service-arn "$service_arn" \
  --region "$region" \
  --profile "$profile" \
  --query 'Service.ServiceUrl' \
  --output text)"

echo "App Runner: $status"
echo "URL: https://${service_url}"

if [[ "$status" == "RUNNING" ]] && curl --fail --silent --show-error --max-time 10 "https://${service_url}/api/config" >/dev/null; then
  echo "API: healthy (/api/config)"
else
  echo "API: not ready (/api/config)" >&2
  exit 1
fi
