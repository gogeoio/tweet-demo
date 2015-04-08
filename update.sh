#!/bin/bash

git checkout -- .
git pull origin master

APP_FOLDER=gogeo-tweet

cd $APP_FOLDER
bower install
gulp deploy
cd ..

rm -rf $APP_FOLDER/dist-old
mv $APP_FOLDER/dist $APP_FOLDER/dist-old
mv $APP_FOLDER/dist $APP_FOLDER/dist-prod