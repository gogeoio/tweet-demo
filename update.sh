#!/bin/bash

git checkout -- .
git pull origin master

APP_FOLDER=gogeo-tweet
cd $APP_FOLDER

rm -rf dist-old
mv dist-prod dist-old

bower install
gulp deploy

mv dist dist-prod

cd ..