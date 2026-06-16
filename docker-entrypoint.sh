#!/bin/sh
set -e

# Named volume mounts as root; the app runs as nextjs and needs write access for SQLite.
if [ -d /app/data ]; then
  chown -R nextjs:nodejs /app/data
fi

exec su-exec nextjs node server.js