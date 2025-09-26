#!/usr/bin/env bash

set -eu
set +x

scriptDir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

echo "Stopping docker..."
docker-compose down

echo "Resetting terminal..."
command -v reset >/dev/null 2>&1 && reset

echo "Infrastructure down!"
