#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/LioraRndr/ArtworkDestructionTool.git"
INSTALL_ROOT="${ARTWORK_DESTRUCTION_TOOL_HOME:-$HOME/.local/share/artwork-destruction-tool}"
SKILL_NAME="artwork-destruction-tool"
SKILL_TARGET="$HOME/.agents/skills/$SKILL_NAME"

command -v git >/dev/null || { echo "Missing git. Install git first."; exit 1; }
command -v node >/dev/null || { echo "Missing node. Install Node.js 20+ first."; exit 1; }

if [ -d "$INSTALL_ROOT/.git" ]; then
  echo "Updating $INSTALL_ROOT"
  git -C "$INSTALL_ROOT" pull --ff-only
else
  echo "Installing to $INSTALL_ROOT"
  mkdir -p "$(dirname "$INSTALL_ROOT")"
  git clone "$REPO_URL" "$INSTALL_ROOT"
fi

mkdir -p "$INSTALL_ROOT/data/generated" "$INSTALL_ROOT/data/tmp"
[ -f "$INSTALL_ROOT/data/records.json" ] || printf '[]\n' > "$INSTALL_ROOT/data/records.json"
[ -f "$INSTALL_ROOT/data/generations.json" ] || printf '[]\n' > "$INSTALL_ROOT/data/generations.json"

mkdir -p "$(dirname "$SKILL_TARGET")"
rm -rf "$SKILL_TARGET"
cp -R "$INSTALL_ROOT/skills/$SKILL_NAME" "$SKILL_TARGET"
echo "Installed skill to $SKILL_TARGET"

if ! command -v gpt-image >/dev/null; then
  if command -v uv >/dev/null; then
    echo "Installing gpt-image CLI through uv..."
    uv tool install git+https://github.com/wuyoscar/gpt_image_2_skill
  else
    echo "Warning: gpt-image CLI was not found. Install uv, then run:"
    echo "  uv tool install git+https://github.com/wuyoscar/gpt_image_2_skill"
  fi
fi

cat > "$INSTALL_ROOT/start.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if command -v git >/dev/null && [ -d .git ]; then
  echo "Checking for updates..."
  git pull --ff-only || echo "Update check skipped."
fi
npm start
EOF
chmod +x "$INSTALL_ROOT/start.sh"

echo ""
echo "Artwork Destruction Tool installed."
echo "Run:"
echo "  $INSTALL_ROOT/start.sh"
echo "Then open http://localhost:5173/"

