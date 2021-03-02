// See ioBindMessageEvents.Test.Native.js 
// for test that check for genral event binding and messages emited
// these test fouce on middleboxs additonal functionality

import chai from "chai";
import { FakeIO, FakeSocket } from "../testDoubles/IO.Fake.com.js";
import { ConnectionManager } from "../../../common/connectionManager.com.js";
import wrtc from "wrtc";
import ws from "ws";
import { RTCPeer, WSPeer, TestPeer, TestPeer2 } from "../../../common/peerSocket.com.js"

const { RTCPeerConnection, RTCSessionDescription } = wrtc;
const WebSocket = ws;

describe ( "(UNIT) Test connection manager additonal server functionality ", () =>{

    it ("Sets the connection manager to server when 'server-set' receives a vaild key from signalling", ( done ) => {

        var clientID = "ClinetID",
            serverKey = "ServerKey";

        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, [TestPeer, []], [TestPeer2, []], 10, serverKey );
        connectionMan.SOCKET_TYPE = TestPeer2.SOCKET_TYPE;
        connectionMan.Init();

        io.triggerBindedMessage("cid", clientID )
        io.triggerBindedMessage( "server-set", {key: clientID + serverKey, type: TestPeer2.SOCKET_TYPE } );

        chai.assert.isTrue( connectionMan.IS_SERVER );

        done();
    });

    it ("Connection manager is not set to server when 'server-set' receives a invaild key from signalling", ( done ) => {

        var clientID = "ClinetID",
            serverKey = "ServerKey";

        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, [TestPeer, []], [TestPeer, []], 10, serverKey );
        connectionMan.Init();

        io.triggerBindedMessage("cid", clientID )
        io.triggerBindedMessage( "server-set", "AnInvalidKey" );

        chai.assert.isFalse( connectionMan.IS_SERVER );

        done();

    });

    /** TODO: this one needs fixing... */
    it( "Emits 'offer-connection' on 'connection-offer-made' when serverKey is supplied in constructor (Server mode)", async ( ) => {

        var clientID = "ClinetID",
        serverKey = "ServerKey";

        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, [TestPeer, []], [TestPeer2, []], 10, serverKey );
        connectionMan.SOCKET_TYPE = TestPeer.SOCKET_TYPE;
        connectionMan.Init();

        // Put the connection into server mode
        io.triggerBindedMessage("cid", clientID )
        io.triggerBindedMessage( "server-set", {key: clientID + serverKey, type: TestPeer.SOCKET_TYPE} );

        await io.triggerBindedMessageAsync("connection-offer-made", {offer:"", to:""})

        chai.assert.isTrue( "offer-connection" in io.emitedMessageEvents );

    });

    it ( "Gameserver id is not set if connection manager is in server mode.", ( done ) => {

        var serverID = "ServerID";
        var serverKey = "ServerKey";
        
        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, [TestPeer, []], [TestPeer, []], 10, serverKey );
        connectionMan.SOCKET_TYPE = TestPeer.SOCKET_TYPE;
        connectionMan.Init();

        // put the connection manager into server mode
        io.triggerBindedMessage( "cid", serverID )
        io.triggerBindedMessage( "server-set", {key: serverID + serverKey, type: TestPeer.SOCKET_TYPE } );

        // prove that we are in server mode.
        chai.assert.isTrue( connectionMan.IS_SERVER );

        // attempt to set the available server.
        io.triggerBindedMessage( "server-available", serverID )

        chai.assert.equal( connectionMan.gameServer_id, null );

        done();
    });

});

describe ( "(UNIT) Test WebSocket and WRTC modes server side", () =>{

    it ( "set-server should emit the server key and socket type on cid is received and isServer", ( done ) =>{
        
        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, [TestPeer, []], [TestPeer2, []], 10, "serverKey" );
        connectionMan.SetSocketType( TestPeer.SOCKET_TYPE );
        connectionMan.Init();

        io.triggerBindedMessage( "cid", "serverID" );

        chai.assert.isTrue( "set-server" in io.emitedMessageEvents, "set-server not emited" )

        var message = io.emitedMessageEvents[ "set-server" ];

        chai.assert.isTrue( "key" in message );
        chai.assert.isTrue( "type" in message );

        done();

    });

    it ( "set-server should not emit if the socket type has not been set", ( done ) =>{

        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, [TestPeer, []], [TestPeer2, []], 10, "serverKey" );
        
        connectionMan.Init();

        io.triggerBindedMessage( "cid", "serverID" );

        chai.assert.isFalse( "set-server" in io.emitedMessageEvents )

        done();

    });

    it ( "Should set the websocket server when server-set is trigger while in websocket mode", (done) => {

        var serverID = "serverID";
        var serverKey = "serverKey";

        var rtc = [ RTCPeer, {"RTCPeerConnection": RTCPeerConnection, "RTCSessionDescription": RTCSessionDescription} ]
        var ws  = [ WSPeer, {"WebSocket": WebSocket} ]

        // replace the WSPeer.CreateServer to prevent the server from attempting to listen for clients.
        WSPeer.CreateServer = function() {
            return {
                on( name, callback ){}
            }
        }

        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, rtc, ws, 10, serverKey );
        connectionMan.SetSocketType( WSPeer.SOCKET_TYPE );
        connectionMan.Init();

        io.triggerBindedMessage( "cid", serverID );
        io.triggerBindedMessage( "server-set", { key: serverID + serverKey, type: WSPeer.SOCKET_TYPE } );

        chai.assert.isNotNull( connectionMan.websocket_server );

        done();
    });

    it ( "Should not set the websocket server when server-set is trigger while in webRTC mode", (done) => {
        
        var serverID = "serverID";
        var serverKey = "serverKey";

        var rtc = [ RTCPeer, {"RTCPeerConnection": RTCPeerConnection, "RTCSessionDescription": RTCSessionDescription} ]
        var ws  = [ WSPeer, {"WebSocket": WebSocket} ]

        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, rtc, ws, 10, serverKey );
        connectionMan.SetSocketType( RTCPeer.SOCKET_TYPE );
        connectionMan.Init();

        io.triggerBindedMessage( "cid", serverID );
        io.triggerBindedMessage( "server-set", serverID + serverKey );

        // just make sure that the WS server is not running. 
        // if its set the test fails, but if it does start, 
        // the test framework will hang
        if ( connectionMan.websocket_server != null )
            connectionMan.websocket_server.close();

        chai.assert.isNull( connectionMan.websocket_server );

        done();

    });

    it ( "Should not set the websocket server when server-set is trigger but not server", (done) => {
        var serverID = "serverID";
        var serverKey = "serverKey";

        var rtc = [ RTCPeer, {"RTCPeerConnection": RTCPeerConnection, "RTCSessionDescription": RTCSessionDescription} ]
        var ws  = [ WSPeer, {"WebSocket": WebSocket} ]

        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, rtc, ws );
        connectionMan.SetSocketType( WSPeer.SOCKET_TYPE );
        connectionMan.Init();

        io.triggerBindedMessage( "cid", serverID );
        io.triggerBindedMessage( "server-set", serverID + serverKey );

        // stop the websocket server 
        if ( connectionMan.websocket_server != null )
            connectionMan.websocket_server.close();
            
        chai.assert.isNull( connectionMan.websocket_server );

        done();
    });



    it ( "Should not change the socket type if already set", (done) => {

        var firstSocketType = TestPeer.SOCKET_TYPE;
        var secondSocketType = TestPeer2.SOCKET_TYPE;

        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, [TestPeer, []], [TestPeer2, []], 10, "serverKey" );
        connectionMan.Init( );
        // set the socket type and prove its been set.
        connectionMan.SetSocketType( firstSocketType );
        chai.assert.equal( connectionMan.SOCKET_TYPE, firstSocketType );

        // attemp to change the socket type, and show that it still equals the first.
        connectionMan.SetSocketType( secondSocketType );
        
        chai.assert.notEqual( connectionMan.SOCKET_TYPE, secondSocketType );
        chai.assert.equal( connectionMan.SOCKET_TYPE, firstSocketType );

        done();
    });

    it ( "should emit the socket mode with the serverID when set-server is emited", (done) => {

        var socketType = TestPeer.SOCKET_TYPE;
        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, [TestPeer, []], [TestPeer2, []], 10, "serverKey" );
        connectionMan.Init( );
        // set the socket type and prove its been set.
        connectionMan.SetSocketType( socketType );
        
        io.triggerBindedMessage( "cid", "clientID");

        // provate that set server was emited
        chai.assert.isTrue( 'set-server' in io.emitedMessageEvents )
        var message = io.emitedMessageEvents['set-server'];

        chai.assert.isTrue( 'type' in message );
        chai.assert.equal( message['type'], socketType );
        
        done();

    });

    it ( "'Connection-offer-made' does not add a peer if in WebSocket mode", async () => {
        
        var socketType = WSPeer.SOCKET_TYPE;
        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, [WSPeer, {"WebSocket": WebSocket}], [TestPeer2, {}], 10, "serverKey" );
        connectionMan.Init( );
        // set the socket type and prove its been set.
        connectionMan.SetSocketType( socketType );
        
        // prove there there is currently no peers in the connected peers array
        chai.assert.lengthOf( Object.keys(connectionMan.connected_peers), 0, "start with a connected peer?" )
        
        await io.triggerBindedMessageAsync( "connection-offer-made", {from: "ClientID", offer: {}} )

        chai.assert.lengthOf( Object.keys(connectionMan.connected_peers), 0 )

    });


    it ( "'Connection-offer-made' does not call connectToPeer when in websocket mode", async () => {

        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, [WSPeer, {"WebSocket": WebSocket}], [TestPeer2, {}], 10, "serverKey" );
        // overwrite the connectToPeer method so we can find out if its called or not.
        connectionMan.connectToPeerCalled = false;
        connectionMan.ConnectToPeer = function(to)
        {
            connectionMan.connectToPeerCalled = true;
        }

        connectionMan.Init( );
        // set the socket type and prove its been set.
        connectionMan.SetSocketType( WSPeer.SOCKET_TYPE );        
        await io.triggerBindedMessageAsync( "connection-offer-made", {from: "ClientID", offer: {}} );

        chai.assert.isFalse( connectionMan.connectToPeerCalled );

    });

    it ( "'Connection-anwser-made' does not call HandleAnswer on the peers socket when in WebSocket mode", async () => {
        // Create a test peer to inject into connectionManagers connected peers arry
        // Also overwriting the HandAnswer method to see if it gets called.
        var peerID = "PeerID";
        var peer = new TestPeer();
        peer.id = peerID;
        peer.handleAnswerCalled = false;
        peer.HandleAnswer = function( answer ){
            peer.handleAnswerCalled = true;
        }
                
        var socketType = WSPeer.SOCKET_TYPE;
        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, [WSPeer, {"WebSocket": WebSocket}], [TestPeer2, {}], 10, "serverKey" );
        connectionMan.Init( );
        // set the socket type and prove its been set.
        connectionMan.SetSocketType( socketType );
        // Add the peer to the connected peers
        connectionMan.connected_peers[peerID] = peer;

        await io.triggerBindedMessageAsync( "connection-anwser-made", {from: peerID, answer: "the answer to life the universe and everything" } )

        chai.assert.isFalse( peer.handleAnswerCalled );

    });

    it ( "ConnectToPeer does not add a peer when in WebSocket mode and IsServer", async ( ) => {

        var serverKey = 'serverKey';
        var clientID = "clientID";

        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, [WSPeer, {"WebSocket": WebSocket}], [TestPeer2, {}], 10, serverKey );

        connectionMan.SetSocketType( WSPeer.SOCKET_TYPE );
        connectionMan.Init( );

        connectionMan.IS_SERVER = true;

        // prove there there is currently no peers in the connected peers array
        chai.assert.lengthOf( Object.keys(connectionMan.connected_peers), 0, "started with a connected peer?" )
        
        await connectionMan.ConnectToPeer( "client" )

        chai.assert.lengthOf( Object.keys(connectionMan.connected_peers), 0 )

    });
/*
    // TODO: if the middle box is not running, this throws an error
    // and if it is online it prevents mocha from exiting.
        
    it ( "ConnectToPeer does not emit 'offer-connection' when in Socket type is WebSocket ", async () => {
         
        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, [WSPeer, {"WebSocket": WebSocket}], [TestPeer2, {}], 10, 'serverKey' );

        connectionMan.SetSocketType( WSPeer.SOCKET_TYPE );
        connectionMan.Init( );

        // prove there there is currently no peers in the connected peers array
        await connectionMan.ConnectToPeer( "client" );

        chai.assert.isFalse( 'offer-connectio ' in io.emitedMessageEvents );

    });
*/
});

//TODO: intergration testing for peers.