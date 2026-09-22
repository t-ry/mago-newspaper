#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$script_dir/find-aws-cli.sh"
aws_cli="$(find_aws_cli)"
"$aws_cli" apprunner pause-service \
  --service-arn arn:aws:apprunner:ap-northeast-1:372387410740:service/mago-newspaper-api/5b39378657d94cee94a77f044c542609 \
  --region ap-northeast-1 \
  --profile "${AWS_PROFILE:-mago}"
