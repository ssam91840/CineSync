#!/bin/bash
set -e

# Create the user and group with the provided PUID and PGID
groupadd -o -g "$PGID" appuser
useradd -o -u "$PUID" -g appuser appuser

# Ensure the app directory and its contents are owned by the appuser
chown -R appuser:appuser /app

# Change to the app directory
cd /app

# Run the command as the appuser
exec gosu appuser "$@"
