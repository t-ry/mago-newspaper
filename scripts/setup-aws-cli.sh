#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_dir="$(cd "$script_dir/.." && pwd)"
install_dir="$project_dir/.tools/aws-cli"

if [[ -x "$install_dir/v2/current/bin/aws" ]]; then
  "$install_dir/v2/current/bin/aws" --version
  exit 0
fi

if command -v aws >/dev/null 2>&1 && aws --version 2>&1 | grep -q '^aws-cli/2'; then
  echo "PATH上のAWS CLI v2を使用できます。"
  exit 0
fi

if [[ "$(uname -s)" != "Linux" || "$(uname -m)" != "x86_64" ]]; then
  echo "このセットアップはLinux x86_64向けです。AWS CLI v2を手動でインストールし、AWS_CLIで指定してください。" >&2
  exit 1
fi

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT
archive="$tmp_dir/awscliv2.zip"
curl --fail --location --silent --show-error \
  https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip \
  --output "$archive"
unzip -q "$archive" -d "$tmp_dir"
"$tmp_dir/aws/install" -i "$install_dir" -b "$project_dir/.tools/bin/aws" --update
"$install_dir/v2/current/bin/aws" --version
