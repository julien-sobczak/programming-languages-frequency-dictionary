#!/bin/bash

##################################
# Parse the file results/python-10000-most-frequent-members.csv
# Filter to keep only standard modules
# Write to standard output in the same format as input file
#
# Usage
# $ ./standard_words.sh \
#       python-10000-most-frequent-members.csv > \
#       python-500-most-frequent-words.csv
###################################

filename="$1"

while read -r line
do
    if [[ ! -z $line ]]; then
        package=${line%%,*}
        count=${line##*,}
        func=$line
        func=${func#$package}
        func=${func%$count}
        func=${func%,}
        func=${func#,}

        if [[ $line == cmd/* ]]; then
            continue
        fi

        #echo "[$package] [$func] [$count]"

        cat - > test.go << OUT
package main

import _ "$package"

func main() {

}
OUT
        #cat test.go
        if go build test.go > /dev/null 2>&1; then
            echo "$line"
        #else # Third-party packages
        #    echo "$line"
        fi

    fi
done < "$filename"
