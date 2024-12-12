#!/bin/bash
if ! command -v http-server &> /dev/null
then
    echo "http-server could not be found. Installing http-server globally..."
    npm install -g http-server
fi
DIRECTORY="."
echo "Starting local server for directory: $DIRECTORY"
http-server "$DIRECTORY" -o
