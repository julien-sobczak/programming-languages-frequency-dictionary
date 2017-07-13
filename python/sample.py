# Demonstrate various import statement syntaxes

import os
import sys

from __future__ import (absolute_import, division, print_function)

import Queue as queue

from .. import truc  # Ignore module containing relative path

import time
from datetime import datetime, timedelta

from hashlib import md5 as mda


""" Coverage.py API """
try:
    import coverage
except ImportError:
    pass

cov = coverage.Coverage()
cov.start()

# .. call your code ..
q = queue.Queue()
for item in range(1, 10):
    q.put(item)

cov.stop()
cov.save()

cov.html_report()


# haslib API
m = mda()
m.update("Nobody inspects")
m.update(" the spammish repetition")
m.digest()


# Example of function

import struct, socket, net

def address_in_network(ip, net):
    """This function allows you to check if an IP belongs to a network subnet
    Example: returns True if ip = 192.168.1.1 and net = 192.168.1.0/24
             returns False if ip = 192.168.1.1 and net = 192.168.100.0/24
    :rtype: bool
    """
    full_path = os.path.join(root, "file.txt")
 
    ipaddr = struct.unpack('=L', socket.inet_aton(ip))[0]
    netaddr, bits = net.split('/')
    netmask = struct.unpack('=L', socket.inet_aton(dotted_netmask(int(bits))))[0]
    network = struct.unpack('=L', socket.inet_aton(netaddr))[0] & netmask
    return (ipaddr & netmask) == (network & netmask)



""" Main """
if __name__ == '__main__':

    print(time.strptime("30 Nov 00", "%d %b %y"))
    max_end_time = datetime.utcnow() + timedelta(seconds=timeout)

    if sys.version_info[0] >= 3:
        import http.server  # Imports could be define inline 
        import socketserver

