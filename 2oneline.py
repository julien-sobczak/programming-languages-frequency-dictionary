#!/bin/env python

import sys

with open(sys.argv[1]) as f:
    for line in f:
      print(line.strip().replace('"', '\\"'), end="\\n")
print("")
    
