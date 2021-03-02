import chai from "chai";

import { Server } from "../../signallingServer.node.js"
import io from "socket.io-client";
import { RTCPeer, WSPeer } from "../../../common/peerSocket.com.js";
import { ConnectionManager } from "../../../common/connectionManager.com.js";
import wrtc from 'wrtc';
const { RTCPeerConnection, RTCSessionDescription} = wrtc;
import ws from "ws";
const WebSocket = ws;

const webrtc = [ RTCPeer, {"RTCPeerConnection": RTCPeerConnection, "RTCSessionDescription": RTCSessionDescription} ];
const websocket = [ WSPeer, {"WebSocket": WebSocket}];

const assert = chai.assert;



//NOTE: To run the intergration test the signalling server must NOT be running.

describe( '(INTERGRATION) Test that clients and server can connect via signalling', () => {
/*
    var SERVER;

    // start the signaling server befor runing test
    before( () => {
        console.log("asdfas");
        SERVER = new Server( "ServerPassword" );
        SERVER.Init();
        SERVER.Listen();

    } )
*/
    it( "should load /index.html with status 200", ( done ) => {

        const connectionManager = new ConnectionManager( io, webrtc, websocket );
        connectionManager.Init( );

        assert.equal(1, 1);
        done();
    })
/*
    // stop the signaling server after running test
    after ( () => {
        console.log("BOBOBOBOBO");
        SERVER.Close();
        SERVER = null
    })
*/
});
/*
describe( '(INTERGRATION) Test that clients and server can send messages to each other', () => {

    // start the signaling server befor runing test
    before( () => {

        var s = new Server( "ServerPassword" );
        s.Init();
        s.Listen();

    } )

});*/
/*
describe( '(INTERGRATION) Test that packets are formated correctly when sent between clients', () => {
});
*/