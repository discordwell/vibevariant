#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSH_HOST="${DEPLOY_SSH_HOST:-ovh2}"
REMOTE_PATH="/opt/vibariant"
REBOOT_SCRIPT="${HOME}/Projects/shared/reboot-vps.sh"

# SSH kicker: test connectivity, reboot via OVH API if unreachable
ensure_ssh() {
  if ssh -o ConnectTimeout=10 -o BatchMode=yes "$SSH_HOST" "true" 2>/dev/null; then
    return 0
  fi
  echo "SSH unreachable — kicking server via OVH API..."
  if [[ -x "$REBOOT_SCRIPT" ]]; then
    "$REBOOT_SCRIPT" ovh2 --wait
  else
    echo "ERROR: reboot script not found: $REBOOT_SCRIPT" >&2
    exit 1
  fi
}

echo "=== Vibariant Deploy ==="
ensure_ssh
echo ""

# Step 1: Sync project to server
echo ">> Syncing to ${SSH_HOST}:${REMOTE_PATH}..."
ssh "${SSH_HOST}" "mkdir -p ${REMOTE_PATH}"
rsync -az --delete \
  --exclude='node_modules/' \
  --exclude='.next/' \
  --exclude='__pycache__/' \
  --exclude='.git/' \
  --exclude='*.pyc' \
  --exclude='.env' \
  --exclude='pgdata/' \
  -e "ssh" \
  "$SCRIPT_DIR/" \
  "${SSH_HOST}:${REMOTE_PATH}/"

# Step 2: Build and start containers
echo ""
echo ">> Building and starting containers..."
ssh "${SSH_HOST}" "cd ${REMOTE_PATH} && docker compose -f docker-compose.prod.yml up -d --build"

# Step 3: Sync Caddy config and reload
echo ""
echo ">> Updating Caddy config..."
scp -q "$SCRIPT_DIR/caddy.conf" "${SSH_HOST}:/tmp/vibariant.com"
ssh "${SSH_HOST}" "sudo mv /tmp/vibariant.com /etc/caddy/sites/vibariant.com && sudo systemctl reload caddy"

# Step 4: Health check
echo ""
echo ">> Checking health..."
sleep 5
ssh "${SSH_HOST}" "curl -sf http://127.0.0.1:3200 > /dev/null && echo 'Dashboard: OK' || echo 'Dashboard: FAIL'"
ssh "${SSH_HOST}" "curl -sf http://127.0.0.1:8200/health > /dev/null && echo 'API: OK' || echo 'API: FAIL'"

echo ""
echo "=== Deploy complete ==="
echo "Dashboard: https://vibariant.com"
echo "API:       https://api.vibariant.com"
