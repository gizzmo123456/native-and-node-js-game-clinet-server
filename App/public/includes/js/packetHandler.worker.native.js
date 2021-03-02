// This is a native js wraper class for packetHander.worker.com.js 
// to standardize the differences between nodejs and natve js
import {PacketHander} from "/common/Packets/packetHandler.worker.com.js"
import {Packet} from "/common/Packets/clientServerPacket.com.js"

new PacketHander( self, Packet );
