#!/usr/bin/env bash

TXT_FILE=$([ "$1" = "SFRA" ] && echo "output-sfra.txt" || echo "output-sg.txt")

if grep -q "Successfully uploaded cartridge" $TXT_FILE; then
    echo "Build successful"
    exit 0
else
    echo "Build not successful"
    exit 1
fi
