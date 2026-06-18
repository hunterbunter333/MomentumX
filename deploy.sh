#!/bin/bash
# MomentumX — GitHub Push Script
# Run this once from your Terminal to push to GitHub.
# Usage: bash deploy.sh

set -e

REPO_NAME="MomentumX"
cd "$(dirname "$0")"

echo ""
echo "🚀 MomentumX — Deploying to GitHub"
echo "──────────────────────────────────"
echo ""

# Check for git
if ! command -v git &>/dev/null; then
  echo "❌ git not found. Install it from https://git-scm.com" && exit 1
fi

# Init git if needed
if [ ! -d ".git" ]; then
  git init
  echo "✅ Git initialized"
fi

# Stage everything (respects .gitignore)
git add .
git commit -m "MomentumX initial deploy" 2>/dev/null || git commit --allow-empty -m "MomentumX update"

echo ""
echo "──────────────────────────────────"
echo "Next: Create a GitHub repo named '$REPO_NAME' at https://github.com/new"
echo "Then run these two commands:"
echo ""
echo "  git remote add origin https://github.com/YOUR_USERNAME/$REPO_NAME.git"
echo "  git push -u origin main"
echo ""
echo "Replace YOUR_USERNAME with your GitHub username."
echo "──────────────────────────────────"
