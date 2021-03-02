from mininet.topo import Topo
from mininet.net import Mininet
from mininet.node import Node
from mininet.log import setLogLevel, info
from mininet.cli import CLI
from mininet.link import Intf

def myNet():

	net = Mininet( topo=None, build=False)

	info( '*** Add switches\n')
	defaultIP = '192.168.43.1/24'  # IP address for r0-eth1
	s0 = net.addSwitch( 's0' )
	innf = Intf( 'eth0', node=s0 )
	net.getNodeByName('s0').setIP(192.168.43.227/24)
	
	info( '*** Add host\n')
	h1 = net.addHost( 'h1', ip='192.168.43.100/24', defaultRoute='via 192.168.43.1' )
	h2 = net.addHost( 'h2', ip='172.16.0.100/12', defaultRoute='via 172.16.0.1' )
	
	info( '*** Add links\n')
	net.addLink( h1, s0 )
	net.addLink( h2, s0 )
	
	net.start();
	
	CLI(net)
	net.stop()
	
if __name__ == '__main__':
	setLogLevel( 'info' )
	myNet()