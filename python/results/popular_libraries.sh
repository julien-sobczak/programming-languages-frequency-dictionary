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
builtins=(abs dict help min setattr all dir hex next slice any divmod id object sorted ascii enumerate input oct staticmethod bin eval int open str bool exec isinstance ord sum bytearray filter issubclass pow super bytes float iter print tuple callable format len property type chr frozenset list range vars classmethod getattr locals repr zip compile globals map reversed __import__ complex hasattr max round delattr hash memoryview set)

declare -a libraries # Collect output

while read -r line
do
    if [[ ! -z $line ]]; then
        member=${line%%,*}
        count=${line##*,}
        func=${member##*.}
        module=${member%%.*}

        standard=false

        # Built-in function?
        if [[ $func = "$module" ]]; then
            for i in "${builtins[@]}"; do
                if [ "$i" == "$func" ]; then
                    standard=true
                fi
            done
        fi

        # Standard module?
        if [ "$standard" = false ]; then
            if python3 -c "import $module" > /dev/null 2>&1; then
                standard=true
            elif python2 -c "import $module" > /dev/null 2>&1; then
                standard=true
            fi
        fi

        if [ "$standard" = false ]; then
            echo $module,$count
        fi
    fi
done < "$filename"
