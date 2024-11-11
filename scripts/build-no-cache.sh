#!/bin/sh

cd $(dirname $0)/..
sudo docker build --no-cache -t muskit/qrt-unnest-api .