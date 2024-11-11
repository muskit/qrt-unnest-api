#!/bin/sh

docker run -i --init --rm -v $(which aws-lambda-rie):/usr/local/bin/aws-lambda-rie -p 9000:8080 --rm --init muskit/qrt-unnest-api
