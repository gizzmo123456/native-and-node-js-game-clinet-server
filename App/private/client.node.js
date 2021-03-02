import { ConnectionManager } from "../common/connectionManager.com.js";
import { RTCPeer, WSPeer } from "../common/peerSocket.com.js";
import { GameManager } from "../common/gameManager.com.js";
import { Packet } from "../common/Packets/clientServerPacket.com.js"
import io from "socket.io-client";

/** Components to setup network access */
import { ComponentManager } from "../common/componentManager.com.js"
import { Component } from "../common/objects/components/base/component.com.js";
import { Transform } from "../common/objects/components/transform.com.js";

/** Components Constructors, for objects that differ between native js and node js */
import { Constructors } from '../common/constructors.com.js';
//import { Inputs }       from '../common/objects/components/inputs.com.js';
import { PlaybackInputs }       from './playbackInputs.node.js';
import { Viewport }     from '../common/viewport.com.js';

/** WebRTC and WebSockets for node js */
import wrtc from 'wrtc';
const { RTCPeerConnection, RTCSessionDescription} = wrtc;

import ws from "ws";
const WebSocket = ws;

const webrtc = [ RTCPeer, {"RTCPeerConnection": RTCPeerConnection, "RTCSessionDescription": RTCSessionDescription} ];
const websocket = [ WSPeer, {"WebSocket": WebSocket}];

// Set compoent network access
ComponentManager.SetObjectActionMode( ComponentManager.OBJECT_ACTION_MODE.NETWORK )
Component.SetNetworkAccess( Transform, false, true );  // Allow transforms to be updated via the network.
Component.SetNetworkAccess( PlaybackInputs, true, false );  // Allow data to be collected from Native Inputs.

// Set the global Components
Constructors.inputs = PlaybackInputs;
Constructors.dataPacket = Packet;

// for some reasion in Nodejs loading in the inputs causes the server to disconnect
// Temp for now.
import fs from "fs";
fs.readFile( `./private/-TEST-RECORDINGS/rec.18-01-2021-01-57-50.cin`, 'utf-8', (err, data) => {

    if ( err )
    {
        console.error( err );
        return;
    }
    let inputs = JSON.parse( `[${data}]` );
    // For some reason this causes the RTCdatachannel to close on node.js
    //this.inputs = data.split("\n");
    //console.log( "Inputs", this.inputs.length );
    PlaybackInputs.SetInputs( inputs );
} );

const connectionManager = new ConnectionManager( io, webrtc, websocket, Packet );
const viewport          = new Viewport( {x: 1200, y: 700}, 48, null );
const gameManager       = new GameManager( 60, viewport, connectionManager );


// Bind onto game manager events
gameManager.BindEvent( "statistics", ( fps, avgDeltaTime, timeSinceStart ) => {

    console.log( "FPS:", fps, "Avg Delta Time:", avgDeltaTime, "ms", "Time Since Start:", timeSinceStart, "sec" );

})

import { TestScene } from '../common/scenes/testScene.js'

connectionManager.Init( );
gameManager.LoadScene( TestScene );
gameManager.Init( );