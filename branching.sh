#!/usr/bin/env bash
local_branch_name="$(git rev-parse --abbrev-ref HEAD)"

valid_branch_regex='^(feature|bugfix|improvement|library|prerelease|release|hotfix)\/.'

message="There is something wrong with your branch name. Branch names in this project must start with feature|bugfix|improvement|library|prerelease|release|hotfix followed by /. Example: feature/name-of-the-feature."

if [[ ! $local_branch_name =~ $valid_branch_regex ]]; then
    echo "$message"
    exit 1
fi

exit 0