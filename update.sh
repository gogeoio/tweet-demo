#!/bin/bash

git checkout -- .
git pull origin master

APP_FOLDER=gogeo-tweet

mv $APP_FOLDER/dist $APP_FOLDER/dist-old

cd $APP_FOLDER
gulp deploy
cd ..