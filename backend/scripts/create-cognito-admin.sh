#!/usr/bin/env bash
set -euo pipefail
if [[ $# -lt 2 ]]; then echo "Usage: $0 <cognito-user-pool-id> <admin-email>"; exit 1; fi
USER_POOL_ID="$1"; ADMIN_EMAIL="$2"
if ! aws cognito-idp admin-get-user --user-pool-id "$USER_POOL_ID" --username "$ADMIN_EMAIL" >/dev/null 2>&1; then
  aws cognito-idp admin-create-user --user-pool-id "$USER_POOL_ID" --username "$ADMIN_EMAIL" --user-attributes Name=email,Value="$ADMIN_EMAIL" Name=email_verified,Value=true
fi
aws cognito-idp admin-add-user-to-group --user-pool-id "$USER_POOL_ID" --username "$ADMIN_EMAIL" --group-name ADMIN
echo "Assigned $ADMIN_EMAIL to ADMIN group."
