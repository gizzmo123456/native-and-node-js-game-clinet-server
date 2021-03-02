// This is a Nodejs wraper class for packetHander.worker.com.js 
// to standardize the differences between nodejs and natve js
import {PacketHander} from "../common/Packets/packetHandler.worker.com.js"
import {Packet} from "../common/Packets/clientServerPacket.com.js"

import worker_thread from 'worker_threads';
const { parentPort } = worker_thread

new PacketHander( parentPort, Packet );