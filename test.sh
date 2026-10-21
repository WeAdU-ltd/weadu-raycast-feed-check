#!/bin/sh
# Local checks. `ray lint` also needs a real Raycast author in package.json (TODO_RAYCAST_USERNAME until the account exists).
set -eu
cd "$(dirname "$0")"
node --test test/
npx --no-install tsc --noEmit -p tsconfig.json
npx --no-install eslint src
npx --no-install prettier --check src
npx --no-install ray build -e dist >/dev/null
rm -rf dist
node -e "const p=require(\"./package.json\");for(const k of [\"name\",\"title\",\"description\",\"icon\",\"author\",\"license\",\"commands\"]) if(!p[k]) throw new Error(k);for(const s of [\"build\",\"dev\",\"lint\",\"publish\"]) if(!p.scripts[s]) throw new Error(s)"
echo "weadu-raycast-feed-check ok"
