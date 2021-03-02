from mininet.net import Mininet
from mininet.node import OVSSwitch, Controller, RemoteController
from mininet.cli import CLI
from mininet.log import info, setLogLevel

setLogLevel('info')

net = Mininet( switch=OVSSwitch )

info('*** Adding remote controllers')
c0 = Controller( 'c0', port=6633, ip='192.168.43.127' )
c1 = Controller( 'c1', port=6634 ) #c1 = Controller( 'c0', ip='127.0.0.1' )
c2 = RemoteController( 'c2', ip='192.168.43.127', port=6633 )

net.addController( c0 )
net.addController( c1 )

#c1 = net.addController( 'c1', controller=RemoteController, ip='192.168.43.127', port=6644 )
#c0 = net.addController( 'c0', controller=RemoteController, ip='127.0.0.1', port=6633  )
#c2 = net.addController( 'c2', controller=Controller, port=6655 )

info( '*** Adding switches' )
s0 = net.addSwitch( 's0' )
s1 = net.addSwitch( 's1' )
#s2 = net.addSwitch( 's2' )

info( '*** Adding host' )
hosts_s0 = [ net.addHost( 'h%d' % n ) for n in [1, 2] ]
hosts_s1 = [ net.addHost( 'h%d' % n ) for n in [3, 4] ]
#hosts_s2 = [ net.addHost( 'h%d' % n ) for n in [5, 6] ]

info( '*** Linking...' )
for h in hosts_s0:
    net.addLink( s0, h )

for h in hosts_s1:
    net.addLink( s1, h )

#for h in hosts_s2:
#    net.addLink( s2, h )

net.addLink( s0, s1 )
#net.addLink( s1, s2 )

info( '*** start network')
net.build()
c0.start()
c1.start()
c2.start()

s0.start( [c0] )
s1.start( [c1] )
#s2.start( [c2] )

info( '*** Ping all')
net.pingAll()

CLI( net )

net.stop()
