#!/bin/bash

set -e

rm -rf /src/dist
mkdir -p /src/dist

cp -rf /opt/qpdf/* /src/dist/

exec "$@"
