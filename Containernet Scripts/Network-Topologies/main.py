#!/usr/bin/env python3

# NOTE. this should be run from '../../App/' with sudo privileges
# or use the ./start_SDN.sh script in the App folder :) << TODO: <<

import database
from datetime import datetime

# mininet==2.3.0dev6
from mininet.net import Mininet
from mininet.node import Controller, OVSSwitch
from mininet.cli import CLI
from mininet.link import Intf, TCLink
from mininet.log import setLogLevel, info

# load the network settings from the database

print( "** Loading network configuration from database" )

network_settings = {
    "config_id": -1,
    "bandwidth": -1,
    "delay": -1,
    "loss": -1,
    "clients": -1
}

with database.MySQL( host="192.168.43.226", user="ca-web" ) as db:
    db.use_db( "cadata" )
    data = db.execute( "SELECT * FROM networkConfig" )  # cols: id, bandwidth (mbps), delay (ms), loss ([int]%), clients

if len( data ) > 0 and len( data[0] ) == len( network_settings ):

    i = 0
    for k in network_settings:
        network_settings[ k ] = data[0][i]
        i += 1
else:
    raise Exception("Unable to set the network settings: No data from database")

print( "** Network Settings: " )
print( network_settings )

# Build network topology
print( "** Building network topology..." )

# Topology
#  Host machine   : SDN
#                 :        [h0:sig]      [h2:cl-0]
#                 :           |         /
# |host|<->[sw]<->:<->[s0]<->[s1]<->[s2]<-->[h3:cl-1]
#                 :           |         \
#                 :        [h1:serv]     [h...]
#                 :

TIMESTAMP = str(datetime.now()).replace(" ", "_")
BASE_LOG_PATH = f"./logs/{{host_type}}--SESSION_ID--{TIMESTAMP}.log"
BASE_IP = "192.168.43."
ip_end = 110

SWITCHES = 3
SERVERS = 2  # 1 for signaling and 1 from game

switch = []
host = []

setLogLevel( 'info' )

net = Mininet( controller=Controller, link=TCLink )

net.addController('c0')

print( f"** Adding {SWITCHES} switches" )
for i in range( SWITCHES ):
    switch.append( net.addSwitch( f"s{i}" ) )

# plug eth0 from system into switch 0
Intf( "eth0", node=switch[0] )

print( f"** Adding Host: {SERVERS} Servers and { network_settings['clients'] } Clients" )
for i in range( network_settings["clients"] + SERVERS):
    host.append( net.addHost( f"h{i}", ip=f"{BASE_IP}{ip_end}" ) )
    ip_end += 1

print( f"** Linking switches..." )
net.addLink( switch[0], switch[1],
             bw=network_settings["bandwidth"],
             delay=F"{network_settings['delay']}ms",
             loss=network_settings['loss'] )

net.addLink( switch[1], switch[2],
             bw=network_settings["bandwidth"],
             delay=F"{network_settings['delay']}ms",
             loss=network_settings['loss'] )

print( f"** Linking host..." )
for i in range( len ( host ) ):
    # host 0 & 1 connect to Switch 1 and the remain connect to switch 2
    if i < 2:
        net.addLink( host[i], switch[1],
                     bw=network_settings["bandwidth"],
                     delay=f"{network_settings['delay']}ms",
                     loss=network_settings['loss'] )
    else:
        net.addLink( host[i], switch[2] )

# TODO: run test...

print( f"** Running commands on host" )
# host
#  [0] signaling server
#  [1] game server
# ...  game clients
#
# NOTE: the '&>' redirects both the stdout and stderr to a log file to prevent the
# buffer from filling up and eventually halting the application
# and the '&' at the end starts the application in the background
for i in range( len ( host ) ):
    cmd = ""
    if i == 0:
        cmd = f"nodejs ./main.node.js 0.0.0.0 &> { BASE_LOG_PATH.format(host_type='signaling') } &"
    elif i == 1:
        cmd =  f"nodejs ./private/gameMiddlebox.node.js ws 0.0.0.0 &> { BASE_LOG_PATH.format(host_type='game_ws') } &"
    else:
        cmd = f"nodejs ./private/client.node.js &> { BASE_LOG_PATH.format(host_type='client'+str(i-SERVERS)) } &"

    if cmd != "":
        host[i].cmd( cmd )

    print(f"h{i}>{cmd}")

print("** Starting..")
net.start()
CLI( net )
print( "** stopping..." )
net.stop()
