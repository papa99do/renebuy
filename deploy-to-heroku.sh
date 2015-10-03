#!/bin/bash

git subtree push --prefix website heroku master

# If cannot push due to confilicts, force push using following command
# git push heroku `git subtree split --prefix website master`:master --force
