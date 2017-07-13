#!/bin/bash

##################################
# Parse the file results/python-10000-most-frequent-members.csv
# Filter to keep only third-party libraries
# Write to standard output
#
# Usage
# $ ./popular_libraries.sh                                   \
#       python-10000-most-frequent-members.csv             | \
#   awk -F, '{a[$1]+=$2;}END{for(i in a)print i", "a[i];}' | \
#   sort -k2 -n -r                                         | \
#    head -100 > python-500-most-popular-libraries.csv
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
        go build test.go > /dev/null 2>&1;
        if [[ $? -ne 0 ]]; then
            echo "$package, $count"
        fi

    fi
done < "$filename"
