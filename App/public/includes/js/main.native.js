import { ConnectionManager } from "/common/connectionManager.com.js";
import { GameManager } from "/common/gameManager.com.js";
import { RTCPeer, WSPeer } from "/common/peerSocket.com.js";
import { Packet } from "/common/Packets/clientServerPacket.com.js";

/** Components to setup network access */
import { ComponentManager } from "/common/componentManager.com.js"
import { Component } from "/common/objects/components/base/component.com.js";
import { Transform } from "/common/objects/components/transform.com.js";

/** Components Constructors, for objects that differ between native js and node js */
import { Constructors }   from '/common/constructors.com.js';
import { NativeInputs }   from '/includes/js/inputs.native.js';
import { Viewport }       from '/common/viewport.com.js';
import { CanvasRenderer } from '/includes/js/canvasRenderer.native.js';

const DEBUG = false;

const rtc = [ RTCPeer, {"RTCPeerConnection": RTCPeerConnection, "RTCSessionDescription": RTCSessionDescription} ];
const ws  = [ WSPeer, {"WebSocket": WebSocket}];

// Set compoent network access
ComponentManager.SetObjectActionMode( ComponentManager.OBJECT_ACTION_MODE.NETWORK )
Component.SetNetworkAccess( Transform, false, true );     // Allow transforms to be updated via the network.
Component.SetNetworkAccess( NativeInputs, true, false );  // Allow data to be collected from Native Inputs.

console.log( "C", Component.canNetworkApply );
console.log( "T", Transform.canNetworkApply );

// Set the global Components
Constructors.dataPacket = Packet;
Constructors.inputs = NativeInputs;

/** HTML elements **/
var status_fps_element        = document.getElementById( "fps" );
var status_delta_element      = document.getElementById( "delta-time" );
var status_sinceStart_element = document.getElementById("since-start-time");
var status_goCount_element    = document.getElementById("gameObject-count");
var debug_element             = document.getElementById( "debug" );
var viewport_element          = document.getElementById( "viewport" );

// initialize Managers.
const connectionManager = new ConnectionManager( io, rtc, ws, Packet ); // TODO: this needs moving onto the worker thread
const packetWorker      = new Worker("/includes/js/packetHandler.worker.native.js", {type: "module"});
const viewport          = new Viewport( {x: 1200, y: 700}, 48, new CanvasRenderer( viewport_element ) );
const gameManager       = new GameManager( 60, viewport, connectionManager, packetWorker, DEBUG );

// Bind onto game manager events
gameManager.BindEvent( "statistics", ( fps, avgDeltaTime, timeSincStart, goCount ) => {

    status_fps_element.innerHTML = fps;
    status_delta_element.innerHTML = avgDeltaTime;
    status_sinceStart_element.innerHTML = timeSincStart;
    status_goCount_element.innerHTML = goCount;
})

import { TestScene } from '/common/scenes/testScene.js'

connectionManager.Init( );
gameManager.LoadScene( TestScene );
gameManager.Init( );
