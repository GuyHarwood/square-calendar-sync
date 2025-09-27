#!/usr/bin/env bash

set -eu
set +x

scriptDir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

# Check if supabase CLI is installed and start it
if command -v supabase >/dev/null 2>&1; then
    echo "Starting supabase..."
    supabase start
else
    echo "Error: supabase CLI not found. Please install it."
    exit -1
fi


echo "Starting docker..."
docker-compose up --build -d

echo "Resetting terminal..."
command -v reset >/dev/null 2>&1 && reset

docker ps
echo ""
echo ""
echo "Infrastructure ready!"
