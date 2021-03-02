#!/usr/bin/env python3

from mininet.net import Containernet
from mininet.node import Controller, Docker, OVSSwitch
from mininet.cli import CLI
from mininet.link import Intf, TCLink
from mininet.log import setLogLevel, info



setLogLevel( 'info' )

net = Containernet(controller=Controller)

net.addController('c0')

info( '*** Adding switches\n' )
s1 = net.addSwitch( 's1', cls=OVSSwitch )
Intf( 'eth0', node=s1 )

info( '*** Adding host\n' )
h1 = net.addHost( 'h1' , ip='192.168.43.110' )
h2 = net.addHost( 'h2' , ip='192.168.43.111' )

# see: https://docker-py.readthedocs.io/en/1.7.0/port-bindings/
# for infomation on port binfing with Docker-py (https://docker-py.readthedocs.io/en/stable/)

info( '*** Adding docker containers\n' )
d1 = net.addDocker('d1', ip='192.168.43.10', dimage="cn-signal:latest", dcmd="node ./main.node.js 0.0.0.0", network_mode="bridge", ports=[8333], port_bindings={8334:8333}, publish_all_ports=True )
d2 = net.addDocker('d2', ip='192.168.43.11', dimage="cn-server:latest", dcmd="node ./private/gameMiddlebox.node.js ws", network_mode="bridge", ports=[8333, 9333], port_bindings={8333:8333, 9333:9333}, publish_all_ports=True )

info( "***Linking\n" )
net.addLink( h1, s1, cls=TCLink, bw=1 ) # must have a TCLink to controle the link speed, jitter ect...
net.addLink( d1, s1, bw=1 )
net.addLink( h2, s1, bw=1 )
net.addLink( d2, s1, bw=1 )

net.start()
info( 'Testing speed\n' )
net.iperf()
CLI( net )
net.stop()
