#!/bin/bash

# Skip all preview deployments - why this can't be disabled in the vercel config I don't know
# so this is what we are forced to do :(

echo "VERCEL_ENV: $VERCEL_ENV"

if [[ "$VERCEL_ENV" == "production" ]] ; then
  # Proceed with the build
  echo "✅ - Build can proceed"
  exit 1;

else
  # Don't build
  echo "🛑 - Build cancelled"
  exit 0;
fi
