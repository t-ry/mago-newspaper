#!/usr/bin/env bash

find_aws_cli() {
  if [[ -n "${AWS_CLI:-}" ]]; then
    printf '%s\n' "$AWS_CLI"
    return
  fi

  if command -v aws >/dev/null 2>&1; then
    command -v aws
    return
  fi

  if [[ -x /tmp/mago-aws-bin/aws ]]; then
    printf '%s\n' /tmp/mago-aws-bin/aws
    return
  fi

  printf '%s\n' \
    'AWS CLIが見つかりません。AWS_CLI=/path/to/aws npm run <command> の形式で場所を指定してください。' >&2
  return 127
}
