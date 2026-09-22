#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$script_dir/find-aws-cli.sh"
aws_cli="$(find_aws_cli)"
"$aws_cli" login --remote --region ap-northeast-1 --profile "${AWS_PROFILE:-mago}"
