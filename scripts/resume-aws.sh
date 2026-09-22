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

if [[ "$status" != "RUNNING" ]]; then
  "$aws_cli" apprunner resume-service \
    --service-arn "$service_arn" \
    --region "$region" \
    --profile "$profile" >/dev/null
fi

for attempt in $(seq 1 60); do
  status="$("$aws_cli" apprunner describe-service \
    --service-arn "$service_arn" \
    --region "$region" \
    --profile "$profile" \
    --query 'Service.Status' \
    --output text)"

  if [[ "$status" == "RUNNING" ]]; then
    service_url="$("$aws_cli" apprunner describe-service \
      --service-arn "$service_arn" \
      --region "$region" \
      --profile "$profile" \
      --query 'Service.ServiceUrl' \
      --output text)"
    if curl --fail --silent --show-error --max-time 10 "https://${service_url}/api/config" >/dev/null; then
      echo "App Runner is RUNNING: https://${service_url}"
      echo "Amplify API: https://main.d2lslwov00yd74.amplifyapp.com/api/config"
      exit 0
    fi
  fi

  case "$status" in
    *_FAILED|DELETED)
      echo "App Runnerの再開に失敗しました（status: $status）。" >&2
      exit 1
      ;;
  esac

  echo "App Runner status: $status（再試行 ${attempt}/60）" >&2
  sleep 5
done

echo "App Runnerが60回の確認後もRUNNINGになりませんでした。" >&2
exit 1
