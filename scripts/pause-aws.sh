#!/usr/bin/env bash
set -euo pipefail

aws_cli="${AWS_CLI:-aws}"
"$aws_cli" apprunner pause-service \
  --service-arn arn:aws:apprunner:ap-northeast-1:372387410740:service/mago-newspaper-api/5b39378657d94cee94a77f044c542609 \
  --region ap-northeast-1 \
  --profile "${AWS_PROFILE:-mago}"
