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
builtins=(abs dict help min setattr all dir hex next slice any divmod id object sorted ascii enumerate input oct staticmethod bin eval int open str bool exec isinstance ord sum bytearray filter issubclass pow super bytes float iter print tuple callable format len property type chr frozenset list range vars classmethod getattr locals repr zip compile globals map reversed __import__ complex hasattr max round delattr hash memoryview set)

while read -r line
do
    if [[ ! -z $line ]]; then
        member=${line%%,*}
        func=${member##*.}
        module=${member%%.*}

        found=false
        if [[ $func = "$module" ]]; then
            for i in "${builtins[@]}"; do
                if [ "$i" == "$func" ]; then
                    echo "$line"
                    found=true
                fi
            done
        fi

        if [ "$found" = false ]; then
            #echo "python3 -c \"import $module\""
            if python3 -c "import $module" > /dev/null 2>&1; then
                echo "$line"
            elif python2 -c "import $module" > /dev/null 2>&1; then
                echo "$line"
            fi
        fi

    fi
done < "$filename"
