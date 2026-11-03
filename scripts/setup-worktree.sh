#!/bin/sh
set -eu

worktree_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$worktree_root"

if ! command -v pnpm >/dev/null 2>&1; then
  printf 'setup-worktree: pnpm is not installed\n' >&2
  exit 1
fi

pinned_pnpm="$(sed -n 's/.*"packageManager": *"pnpm@\([^"]*\)".*/\1/p' package.json)"
if [ -z "$pinned_pnpm" ]; then
  printf 'setup-worktree: package.json does not pin a pnpm version\n' >&2
  exit 1
fi

installed_pnpm="$(cd / && pnpm --version)"
if [ "$installed_pnpm" = "$pinned_pnpm" ]; then
  pnpm install --frozen-lockfile --reporter=silent
else
  pnpm --reporter=silent dlx "pnpm@$pinned_pnpm" install --frozen-lockfile --reporter=silent
fi

printf 'Worktree ready: %s\n' "$worktree_root"
