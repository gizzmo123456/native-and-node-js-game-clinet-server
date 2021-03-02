import { ConnectionManager } from "/common/connectionManager.com.js";
import { FakeSocket } from "/testDoubles/IO.Fake.com.js";
import { RTCPeer, WSPeer, TestPeer, TestPeer2 } from "/common/peerSocket.com.js";

suite('(UNIT) check that the client socket binds onto the require mesage events', () =>{
    
    test("Binds on to 'cid' message event", ( done ) => {
        var io = new FakeSocket();
        var rtc = [ RTCPeer, {"RTCPeerConnection": RTCPeerConnection, "RTCSessionDescription": RTCSessionDescription} ]
        var ws  = [ WSPeer, {"WebSocket": WebSocket} ]

        var connectionMan = new ConnectionManager( io, rtc, ws );
        connectionMan.Init();

        chai.assert.isTrue( "cid" in io.bindedMessageEvents );

        done();
    });

    test( "Binds on to 'server-available' message event", ( done ) => {
        var io = new FakeSocket();
        var rtc = [ RTCPeer, {"RTCPeerConnection": RTCPeerConnection, "RTCSessionDescription": RTCSessionDescription} ]
        var ws  = [ WSPeer, {"WebSocket": WebSocket} ]

        var connectionMan = new ConnectionManager( io, rtc, ws );
        connectionMan.Init();

        chai.assert.isTrue( "server-available" in io.bindedMessageEvents );

        done();
    });

    test("Binds on to 'connection-offer-made' message event", ( done ) => {
        var io = new FakeSocket();
        var rtc = [ RTCPeer, {"RTCPeerConnection": RTCPeerConnection, "RTCSessionDescription": RTCSessionDescription} ]
        var ws  = [ WSPeer, {"WebSocket": WebSocket} ]

        var connectionMan = new ConnectionManager( io, rtc, ws );
        connectionMan.Init();

        chai.assert.isTrue( "connection-offer-made" in io.bindedMessageEvents );

        done();
    });

    test("Binds on to 'connection-anwser-made' message event", ( done ) => {
        var io = new FakeSocket();
        var rtc = [ RTCPeer, {"RTCPeerConnection": RTCPeerConnection, "RTCSessionDescription": RTCSessionDescription} ]
        var ws  = [ WSPeer, {"WebSocket": WebSocket} ]

        var connectionMan = new ConnectionManager( io, rtc, ws );
        connectionMan.Init();

        chai.assert.isTrue( "connection-anwser-made" in io.bindedMessageEvents );

        done();
    });

});

// See /GameMiddlebox/ioBindMessageEvents.Test.Node.js 
// for additonal test required by the server.
suite('(UNIT) check that the clients sockets emits the required message to the signaling server', () =>{
    
    test( "client socket emits 'offer-connection' when ConnectToPeer is called", async () => {

        var io = new FakeSocket();
        var testPeer_1 = [ TestPeer, [] ]
        var testPeer_2  = [ TestPeer2, [] ]

        var connectionMan = new ConnectionManager( io, testPeer_1, testPeer_2 );
        connectionMan.SOCKET_TYPE = testPeer_1[0].SOCKET_TYPE;
        connectionMan.Init();
        await connectionMan.ConnectToPeer("ClientID");
        console.log( io.emitedMessageEvents );
        chai.assert.isTrue( "offer-connection" in io.emitedMessageEvents );
        //done();
    });

    test( "client socket emits 'anwser-connection' when 'connection-offer-made' is trigger", async () => {

        var io = new FakeSocket();
        
        var rtc = [ RTCPeer, {"RTCPeerConnection": RTCPeerConnection, "RTCSessionDescription": RTCSessionDescription} ]
        var ws  = [ WSPeer, {"WebSocket": WebSocket} ]

        var connectionMan = new ConnectionManager( io, rtc, ws);

        var peer = new RTCPeer( "ClientID" );
        var offer = await peer.CreateOffer(); 
        
        connectionMan.SOCKET_TYPE = rtc[0].SOCKET_TYPE;
        connectionMan.Init();
        await io.triggerBindedMessageAsync("connection-offer-made", {offer: offer, from:""})

        chai.assert.isTrue( "anwser-connection" in io.emitedMessageEvents );
    });

    test( "No message is emited on 'connection-anwser-made'", async () => {
        var clientID = "clientID";
        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, [TestPeer, []], [TestPeer2, []] );
        connectionMan.SOCKET_TYPE = TestPeer.SOCKET_TYPE;
        connectionMan.Init();

        // connect to peer to add a peer to connection peers.
        await connectionMan.ConnectToPeer( clientID );
        // clear any messages that have been emited befor connection-answer-made is triggered
        io.emitedMessageEvents = {};    
        await io.triggerBindedMessageAsync("connection-anwser-made", {offer:"", from: clientID})

        chai.assert.isTrue( Object.keys(io.emitedMessageEvents).length == 0 );

    });

    test( "'offer-connection' is not emited when 'connection-offer-made' is triggered and serverKey has not been supplied to the constructor ", async () => {
        var clientID = "clientID";
        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, [TestPeer, []], [TestPeer2, []] );
        connectionMan.Init();
        connectionMan.SOCKET_TYPE = TestPeer.SOCKET_TYPE;

        // connect to peer to add a peer to connection peers.
        await connectionMan.ConnectToPeer( clientID ); 
        // clear any messages that have been emited befor connection-answer-made is triggered
        io.emitedMessageEvents = {}; 
        await io.triggerBindedMessageAsync("connection-offer-made", {offer:"", from: clientID})

        chai.assert.isFalse( 'offer-connection' in io.emitedMessageEvents );

    });

    test( "'set-server' is not emited when 'cid' message event is trigger and serverKey is not supplied in the constructor", (done)=>{

        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, [TestPeer, []], [TestPeer2, []] );
        connectionMan.Init();
        io.triggerBindedMessage("cid", "clientID")

        chai.assert.isFalse( "set-server" in io.emitedMessageEvents );

        done();

    });
    
});

suite('(UNIT) check that the connectionManage behaviours correctly', () =>{
    
    test ( "The game server ID is set when server-available event is triggered", ( done ) => {

        var serverID = "ServerID";

        var io = new FakeSocket();
        var rtc = [ RTCPeer, {"RTCPeerConnection": RTCPeerConnection, "RTCSessionDescription": RTCSessionDescription} ]
        var ws  = [ WSPeer, {"WebSocket": WebSocket} ]

        var connectionMan = new ConnectionManager( io, rtc, ws );
        connectionMan.Init();

        io.triggerBindedMessage( "server-available", {sid: serverID, type: RTCPeer.SOCKET_TYPE } )

        chai.assert.equal( connectionMan.gameServer_id, serverID );

        done();

    });

    test ( "The game server ID is not set when server-available event is triggered and already set", ( done ) => {

        var serverID_1 = "ServerID_1";
        var serverID_2 = "ServerID_2";

        var io = new FakeSocket();
        var rtc = [ RTCPeer, {"RTCPeerConnection": RTCPeerConnection, "RTCSessionDescription": RTCSessionDescription} ]
        var ws  = [ WSPeer, {"WebSocket": WebSocket} ]

        var connectionMan = new ConnectionManager( io, rtc, ws );
        connectionMan.Init();

        io.triggerBindedMessage( "server-available", {sid: serverID_1, type: RTCPeer.SOCKET_TYPE } )
        io.triggerBindedMessage( "server-available", {sid: serverID_2, type: RTCPeer.SOCKET_TYPE } )

        chai.assert.notEqual( connectionMan.gameServer_id, serverID_2 );
        chai.assert.equal( connectionMan.gameServer_id, serverID_1 );

        done();

    });

    test ( "ConnectToPeer is called when the game server ID is set via the server-available event", ( done ) => {

        var serverID = "ServerID";

        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, [TestPeer, []], [TestPeer2, []] );

        // add the required feilds to the connection manager and
        // overwirte the connectToPeer Method
        connectionMan.connectToPeerCalled = "";
        connectionMan.ConnectToPeer = function( to ){
            connectionMan.connectToPeerCalled = to;
        }

        connectionMan.Init();
        io.triggerBindedMessage( "server-available", {sid: serverID, type: TestPeer.SOCKET_TYPE } )

        chai.assert.equal( connectionMan.connectToPeerCalled, serverID );

        done();

    });

    test ( "ConnectToPeer is not called again if another server id is received", ( done ) => {

        var serverID_1 = "ServerID_1";
        var serverID_2 = "ServerID_2";

        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, [TestPeer, []], [TestPeer2, []]  );

        // add the required feilds to the connection manager and
        // overwirte the connectToPeer Method
        connectionMan.connectToPeerCalled = "";
        connectionMan.ConnectToPeer = function( to ){
            connectionMan.connectToPeerCalled = to;
        }

        connectionMan.Init();
        io.triggerBindedMessage( "server-available", {sid: serverID_1, type: TestPeer.SOCKET_TYPE } )
        io.triggerBindedMessage( "server-available", {sid: serverID_2, type: TestPeer2.SOCKET_TYPE } )

        chai.assert.notEqual( connectionMan.connectToPeerCalled, serverID_2 );
        chai.assert.equal( connectionMan.connectToPeerCalled, serverID_1 );

        done();

    });

    test ( "The RTC dataChannle is only created by the peer that creates the initial connection", async () => {
    //TODO: Add intergration version of test!

        var serverKey = "ServerKey";

        var peer_1 = "clientID";
        var peer_2 = "serverID";

        var tp_1 = [TestPeer, []];
        var tp_2 = [TestPeer2, []]; 

        var socket_type = tp_1[0].SOCKET_TYPE;

        var io_client = new FakeSocket();
        var io_server = new FakeSocket();

        var connMan_client = new ConnectionManager( io_client, tp_1, tp_2 )
        var connMan_server = new ConnectionManager( io_server, tp_1, tp_2, 10, serverKey )

        connMan_client.Init();
        connMan_server.Init();

        connMan_server.SOCKET_TYPE = socket_type;

        // send the peers client ids
        io_client.triggerBindedMessage( "cid", peer_1 );
        io_server.triggerBindedMessage( "cid", peer_2 );

        // notify the client of the servers availablity, and trigger the inital ConnectToPeer
        io_client.triggerBindedMessage( "server-available", {sid: peer_2, type: socket_type } )

        // receive the offer on the server, which triggers the responce ConnectToPeer, but without creating dataChannle.
        await io_server.triggerBindedMessageAsync( "connection-offer-made", {from: peer_1, offer: ""} );

        var peerSocket_client_dataChannels = connMan_client.connected_peers[ peer_2 ].dataChannels;
        var peerSocket_server_dataChannels = connMan_server.connected_peers[ peer_1 ].dataChannels;

        chai.assert.lengthOf( peerSocket_client_dataChannels, 1 );
        chai.assert.lengthOf( peerSocket_server_dataChannels, 0 );

    });

    test ( "Test WebRTC and Webscoket peers constructors have a unquie socket ID", ( done ) => {

        var io = new FakeSocket();
        var rtc = [ RTCPeer, {"RTCPeerConnection": RTCPeerConnection, "RTCSessionDescription": RTCSessionDescription} ]
        var ws  = [ WSPeer, {"WebSocket": WebSocket} ]

        var connectionMan = new ConnectionManager( io, rtc, ws );

        // if rtc and ws where unique there will be exactly two classes available
        chai.assert.lengthOf( Object.keys(connectionMan.classes), 2 );
        done();

    } );

    test ( "WSPeer Create Server retruns null in web browsers", ( done ) => {

        chai.assert.equal( WSPeer.CreateServer(), null );
        done();

    } );

});

suite ( "(UNIT) Test WebSocket and WRTC modes client side", () =>{

    test( "SetSocketType does not change the socket type if a server key is not supplied in the managers constructor", ( done ) => {

        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, [TestPeer, []], [TestPeer2, []]  );
        
        var original_socket_type = "originalType";
        var new_socket_type = "newType";

        connectionMan.SOCKET_TYPE = original_socket_type;

        connectionMan.SetSocketType( new_socket_type );

        chai.assert.equal( connectionMan.SOCKET_TYPE, original_socket_type );
        done();
    } );

    test( "Test that socket type is set to WebSocket, when received in 'server-available' message", async () => {
        
        var io = new FakeSocket();
        var rtc = [ RTCPeer, {"RTCPeerConnection": RTCPeerConnection, "RTCSessionDescription": RTCSessionDescription} ];
        var ws  = [ WSPeer, {"WebSocket": WebSocket} ];

        var connectionMan = new ConnectionManager( io, rtc, ws );
        connectionMan.Init();

        await io.triggerBindedMessageAsync( "server-available", {sid: "serverID", type: rtc[0].SOCKET_TYPE} )

        chai.assert.equal( connectionMan.SOCKET_TYPE, RTCPeer.SOCKET_TYPE );

    } );

    test( "Test that socket type does not update if an invalid socket type is received in 'server-available' message", async () => {
        var io = new FakeSocket();
        var rtc = [ RTCPeer, {"RTCPeerConnection": RTCPeerConnection, "RTCSessionDescription": RTCSessionDescription} ]
        var ws  = [ WSPeer, {"WebSocket": WebSocket} ]

        var invalidSocketType = "invalidSocketType";

        var connectionMan = new ConnectionManager( io, rtc, ws );
        connectionMan.SOCKET_TYPE = RTCPeer.SOCKET_TYPE
        connectionMan.Init();

        await io.triggerBindedMessageAsync( "server-available", {sid: "serverID", type: invalidSocketType} );

        chai.assert.notEqual( connectionMan.SOCKET_TYPE, invalidSocketType );
        
    } );

    test ( "Test that the Socket type does not change when if already set", async () => {
        
        var io = new FakeSocket();
        var rtc = [ RTCPeer, {"RTCPeerConnection": RTCPeerConnection, "RTCSessionDescription": RTCSessionDescription} ]
        var test  = [ TestPeer, {} ]

        var connectionMan = new ConnectionManager( io, rtc, test );
        connectionMan.SOCKET_TYPE = RTCPeer.SOCKET_TYPE
        connectionMan.Init();

        await io.triggerBindedMessageAsync( "server-available", {sid: "serverID", type: rtc[0].SOCKET_TYPE } );
        await io.triggerBindedMessageAsync( "server-available", {sid: "serverID", type: test[0].SOCKET_TYPE } );

        chai.assert.notEqual( connectionMan.SOCKET_TYPE, TestPeer.SOCKET_TYPE );

    } );

    // TODO: requires some work on the signaling server 
    test ( "Test that the socket type is reset to null when server is diconnected from signalling", async () => {
        
        var serverID = "server";

        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, [TestPeer, []], [TestPeer2, []] );
        connectionMan.Init();

        await io.triggerBindedMessageAsync( "server-available", {sid: serverID, type: TestPeer.SOCKET_TYPE } );

        // prove that the server has been set
        chai.assert.isNotNull( connectionMan.gameServer_id );

        // disconnect the server and show that the server has been un set.
        io.triggerBindedMessage( "server-disconnect", serverID );

        chai.assert.isNull( connectionMan.gameServer_id );

    } );

    test ( "Test that the gameServerID is reset to null when server is diconnected from signalling", async () => {
        
        var serverID = "server";

        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, [TestPeer, []], [TestPeer2, []] );
        connectionMan.Init();

        await io.triggerBindedMessageAsync( "server-available", {sid: serverID, type: TestPeer.SOCKET_TYPE } );

        // prove that the server socket type has been set
        chai.assert.isNotNull( connectionMan.SOCKET_TYPE );

        // disconnect the server and show that the server has been un set.
        io.triggerBindedMessage( "server-disconnect", serverID );

        chai.assert.isNull( connectionMan.SOCKET_TYPE );
    
    } );

    // Note: connection-offer-made is covered in connectionManager.server.test.node.js 
    // Note: connection-anwser-made is covered in connectionManager.server.test.node.js 
    // As both should do nothing when called in WebSocket mode. and previous test will cover the RTC side

    test ( "Test that ConnectToPeer Creates a new peer socket when connection manager is constructed without a server key.", async () => {
        
        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, [TestPeer, []], [TestPeer2, []] );
        connectionMan.Init();
        connectionMan.SOCKET_TYPE = TestPeer.SOCKET_TYPE;
        // prove that we start with 0 connections
        chai.assert.lengthOf( Object.keys(connectionMan.connected_peers), 0 );

        var client_1 = "Client1";

        await connectionMan.ConnectToPeer( client_1 );

        chai.assert.lengthOf( Object.keys(connectionMan.connected_peers), 1 );

    } );

    test ( "Test that ConnectToPeer only allows to connect to MAX_CONNECTIONs ", async () => {
        var io = new FakeSocket();
        var connectionMan = new ConnectionManager( io, [TestPeer, []], [TestPeer2, []], 1 );
        connectionMan.Init();
        connectionMan.SOCKET_TYPE = TestPeer.SOCKET_TYPE;
        // prove that we start with 0 connections
        chai.assert.lengthOf( Object.keys(connectionMan.connected_peers), 0 );

        var client_prf = "Client-";

        // Add 5 more connection than max connections
        for ( var i = 0; i < connectionMan.MAX_CONNECTIONS + 5; i++ )
        {
            await connectionMan.ConnectToPeer( client_prf + i );
            // prove that a seconds was not added
            chai.assert.isTrue( Object.keys(connectionMan.connected_peers).length <= connectionMan.MAX_CONNECTIONS );
        }
    } );

});