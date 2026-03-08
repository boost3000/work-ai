#!/bin/bash
set -euo pipefail

# Only run in remote/cloud environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
    exit 0
fi

DENO_INSTALL="${HOME}/.deno"
DENO_BIN="${DENO_INSTALL}/bin/deno"

# Install Deno if not already available
if ! command -v deno &> /dev/null && [ ! -f "$DENO_BIN" ]; then
    echo "Installing Deno from GitHub releases..."
    LATEST=$(curl -s https://api.github.com/repos/denoland/deno/releases/latest | grep '"tag_name"' | cut -d'"' -f4)
    mkdir -p "${DENO_INSTALL}/bin"
    curl -fsSL "https://github.com/denoland/deno/releases/download/${LATEST}/deno-x86_64-unknown-linux-gnu.zip" \
        -o /tmp/deno.zip
    unzip -o /tmp/deno.zip -d "${DENO_INSTALL}/bin"
    rm /tmp/deno.zip
    chmod +x "$DENO_BIN"
    echo "Deno installed: $("$DENO_BIN" --version | head -1)"
else
    echo "Deno already available: $("${DENO_BIN}" --version | head -1)"
fi

# Persist Deno PATH and TLS settings for the session
echo "export DENO_INSTALL=\"\${HOME}/.deno\"" >> "$CLAUDE_ENV_FILE"
echo "export PATH=\"\${HOME}/.deno/bin:\${PATH}\"" >> "$CLAUDE_ENV_FILE"
echo "export DENO_TLS_CA_STORE=system" >> "$CLAUDE_ENV_FILE"

# Pre-cache all dependencies using the lock file
echo "Caching Deno dependencies..."
cd "$CLAUDE_PROJECT_DIR"
DENO_TLS_CA_STORE=system "${DENO_BIN}" install --frozen

echo "Session setup complete."
