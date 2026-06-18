#!/bin/bash
# Uses GitHub Desktop's bundled git — no Xcode needed
GIT="/Users/hunter/Downloads/GitHub Desktop.app/Contents/Resources/app/git/bin/git"

if [ ! -f "$GIT" ]; then
  echo "❌ GitHub Desktop git not found."
  exit 1
fi

cd ~/goal-ai

echo "Setting remote origin..."
"$GIT" remote remove origin 2>/dev/null || true
"$GIT" remote add origin https://github.com/hunterbunter333/MomentumX.git

echo "Switching to main branch..."
"$GIT" branch -M main

echo "Pushing to GitHub..."
"$GIT" push -u origin main

echo ""
echo "✅ Done! Check https://github.com/hunterbunter333/MomentumX"
