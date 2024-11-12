#!/bin/sh

cd $(dirname $0)/..
BROWSER_PATH=/usr/bin/chromium node src/express.js
