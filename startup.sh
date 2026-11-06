#!/bin/sh
# Revive the Dust Records preview. Idempotent.
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
cd /workspace
npm run dev
