// Entry point for game server.
// Args: 
//  [0] rtc for WebRTC mode or ws for WebSocket mode
//  [1] (optional) websocket ip address for clients to connect to. Default: localhost.
//      Note: the WebSocket server IP is set to 0.0.0.0 regardless of this value 
//  ie  node ./private/gameMiddlebox.node.js ws 127.0.0.1
//  The server WebSocket server port is set to 9333
//
//  WebRTC should work all this out by it self (hopfully)
//

import { ConnectionManager } from "../common/connectionManager.com.js";
import { RTCPeer, WSPeer }   from "../common/peerSocket.com.js";
import { Packet } from "../common/Packets/clientServerPacket.com.js";
import io from "socket.io-client";

import { GameManager } from "../common/gameManager.com.js";
import { UID }         from "../common/componentManager.com.js";

/** Components to setup network access */
import { ComponentManager } from "../common/componentManager.com.js"
import { Component } from "../common/objects/components/base/component.com.js";
import { Transform } from "../common/objects/components/transform.com.js";

/** Components Constructors, for objects that differ between native js and node js */
import { Constructors } from '../common/constructors.com.js';
//import { Inputs }       from '../common/objects/components/inputs.com.js';
import { RecordInputs } from './recordInputs.node.js'
import { Viewport }     from '../common/viewport.com.js';

import worker_thread from 'worker_threads';
const {Worker} = worker_thread

import wrtc from 'wrtc';
const { RTCPeerConnection, RTCSessionDescription} = wrtc;

import ws from "ws";
const WebSocket = ws;

const webrtc = [ RTCPeer, {"RTCPeerConnection": RTCPeerConnection, "RTCSessionDescription": RTCSessionDescription} ];
const websocket  = [ WSPeer, {"WebSocket": WebSocket}];

const DEBUG = false;
// when we not debuging we overwrite console.log when the gameManager is initialized.
// However in node js application we use this to print the statistics, so we'll copy 
// it befor initializing the game manager
let log = console.log;

// Set compoent network access
ComponentManager.SetObjectActionMode( ComponentManager.OBJECT_ACTION_MODE.BOTH )
Component.SetNetworkAccess( Transform, true, false );       // Allow data to be collected from transforms.
Component.SetNetworkAccess( RecordInputs, false, true );     // Allow the inputs component to be update via the netwrok.

// prevent the inputs from being constructed remotly, except for the owner.
// (This does not need to be applied on the clients. Since clients are in Network mode only)
Component.SetNetworkConstructorMode( RecordInputs, Component.NETWORK_CONSTRUCTOR_MODES.ASSIGNED ) 

// Set the global Components
Constructors.inputs = RecordInputs;
Constructors.dataPacket = Packet; 

// Set the uid_prefix to 's' so it does not clash with the 
// clients 'l' prefix if the object is spwaned on the client
UID.uid_prefix = 's';           

const connectionManager = new ConnectionManager( io, webrtc, websocket, Packet, 10, "thisIsMyPassword" );
const packetHandler     = new Worker("./private/packetHandler.worker.node.js");
const viewport          = new Viewport( {x: 1200, y: 400}, 48, null );
const gameManager       = new GameManager( 30, viewport, connectionManager, packetHandler, DEBUG );

// Bind onto game manager events
gameManager.BindEvent( "statistics", ( fps, avgDeltaTime, timeSinceStart, goCount ) => {

    log( "FPS:", fps, "Avg Delta Time:", avgDeltaTime, "ms", "Time Since Start:", timeSinceStart, "sec", "GO Count: ", goCount );
    
})

/** Start */

if ( process.argv[2] == "rtc")
    connectionManager.Init( RTCPeer.SOCKET_TYPE );
else
    connectionManager.Init( WSPeer.SOCKET_TYPE );

import { TestScene } from '../common/scenes/testScene.js'

gameManager.LoadScene( TestScene );
gameManager.Init();
