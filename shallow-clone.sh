#!/usr/bin/env bash

set -e

GIT_URL="$1"
GIT_PATH="$2"
GIT_REF="$3"

mkdir -p "$GIT_PATH"

cd "$GIT_PATH"
git init --quiet
git remote add origin "$GIT_URL"
git fetch --depth 1 origin "$GIT_REF"
git checkout --quiet FETCH_HEAD
