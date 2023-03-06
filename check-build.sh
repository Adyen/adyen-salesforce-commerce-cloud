#!/usr/bin/env bash

if grep -q "Successfully uploaded cartridge" output.txt; then
    echo "Build successful"
    exit 0
else
    echo "Build not successful"
    exit 1
fi
