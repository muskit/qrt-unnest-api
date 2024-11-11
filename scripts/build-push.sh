#!/bin/sh

$(dirname $0)/build.sh

# build
source $(dirname $0)/../.env

# tag
sudo docker tag muskit/qrt-unnest-api $DKR_URI

# auth (AWS ECR) & push
pswd=$(aws ecr get-login-password --region us-east-1)
sudo docker login -u AWS -p $pswd $DKR_URI
unset pswd
sudo docker push $DKR_URI

# update function
aws lambda update-function-code --function-name=qrt-unnest-api --image-uri=$DKR_URI:latest