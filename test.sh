#!/bin/sh
# Local checks. Shared logic tests come from WeAdU-ltd/weadu-com-webflow tools/wea-323.
set -eu
cd "$(dirname "$0")"
cmp src/feed.js test/feed.js
node --test --test-name-pattern="feed|title|rss" test/logic.test.js
node -e "const p=require(\"./package.json\");for(const k of [\"name\",\"title\",\"description\",\"icon\",\"author\",\"license\",\"commands\"]) if(!p[k]) throw new Error(k)"
echo "weadu-raycast-feed-check ok"
