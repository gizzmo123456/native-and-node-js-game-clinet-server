from mininet.topo import Topo
from mininet.net import Mininet
from mininet.node import Node
from mininet.log import setLogLevel, info
from mininet.cli import CLI

class NetworkTopo( Topo ):
	def build(self, **_opts):
		defaultIP = '192.168.43.1/24'  # IP address for r0-eth1
		s0 = self.addSwitch( 's0' )
		
		h1 = self.addHost( 'h1', ip='192.168.43.100/24', defaultRoute='via 192.168.43.1' )
		h2 = self.addHost( 'h2', ip='172.16.0.100/12', defaultRoute='via 172.16.0.1' )
		
		self.addLink( h1, s0 )
		self.addLink( h2, s0 )

if __name__ == '__main__':
	
	topo = NetworkTopo()
	net = Mininet( topo=topo ) 
	net.start()
	info( '*** Routing Table on Router:\n' )
	print((net[ 'r0' ].cmd( 'route' )))
	CLI( net )
	net.stop()
	