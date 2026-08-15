#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# Scholarship Matcher — push to GitHub in one command
#
# Run this from inside the project folder (where package.json is).
# It will:
#   1. Create a PUBLIC repo "scholarship-matcher" on your GitHub
#   2. Push the full project to the `main` branch
#
# REQUIREMENT: you must be logged into the GitHub CLI.
#   If not, run:  gh auth login
# ──────────────────────────────────────────────────────────────
set -e

REPO_NAME="scholarship-matcher"
DESCRIPTION="Automatic Scholarship Matcher for Students — React + Vite + Tailwind + Firebase"

echo "▶ Checking GitHub CLI auth..."
gh auth status || { echo "✗ Not logged in. Run: gh auth login"; exit 1; }

echo "▶ Ensuring git repo is initialized..."
git rev-parse --git-dir >/dev/null 2>&1 || git init -q

# Rename current branch to main
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")
[ -z "$CURRENT_BRANCH" ] && git checkout -q -b main
[ "$CURRENT_BRANCH" != "main" ] && [ -n "$CURRENT_BRANCH" ] && git branch -q -M main

echo "▶ Committing any uncommitted changes..."
git add -A
git diff --cached --quiet || git commit -q -m "feat: Scholarship Matcher — full app (matching engine, dashboard, admin, i18n, PWA, Render setup)"

echo "▶ Creating GitHub repo: $REPO_NAME ..."
# Create repo if it doesn't already exist (ignore error if it does)
gh repo create "$REPO_NAME" --public --description="$DESCRIPTION" --source=. --remote=origin --push 2>/dev/null \
  || { echo "▶ Repo may already exist, adding remote and pushing..."; \
       git remote remove origin 2>/dev/null; \
       gh repo create "$REPO_NAME" --public --source=. --remote=origin 2>/dev/null \
         || git remote add origin "https://github.com/$(gh api user --jq .login)/$REPO_NAME.git"; }

echo "▶ Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Done! Your project is live at:"
echo "   https://github.com/$(gh api user --jq .login)/$REPO_NAME"
echo ""
echo "Next: deploy to Render — see README.md → 'Deploy to Render' section."
