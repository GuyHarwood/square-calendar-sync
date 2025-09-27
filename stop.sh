#!/usr/bin/env bash

set -eu
set +x

scriptDir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

echo "Stopping docker..."
docker-compose down
supabase stop

echo "Resetting terminal..."
command -v reset >/dev/null 2>&1 && reset

docker ps

echo ""
echo ""
echo "Infrastructure down!"
