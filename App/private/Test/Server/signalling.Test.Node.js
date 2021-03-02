import chai from "chai";
import { FakeIO, FakeSocket } from "../testDoubles/IO.Fake.com.js"
import { Server } from "../../signallingServer.node.js"
import {TestPeer} from "../../../common/peerSocket.com.js"

const assert = chai.assert;
const expect = chai.expect;

describe( "(UNIT) Test signal behaviours correctly", () =>{

    it( "The server socket is set when an valid server key is received", ( done ) => {

        var clientID = "ClinetID",
        serverKey = "ServerKey";

        var server = new Server( serverKey );
        server.io = new FakeIO();

        var socket = new FakeSocket();
        socket.id = clientID;
        
        // initalize the server and trigger the connection event
        server.Init();
        server.io.triggerBindedMessage( "connection", socket );

        socket.triggerBindedMessage( "set-server", {key: clientID + serverKey, type: "Type" } );

        assert.equal( server.serverSocket, socket);
        
        done();
    });

    it( "The server socket is not set if already set, when an valid server key is received", ( done ) => {

        var serverKey = "ServerKey";
        var clientID_1 = "ClinetID-1";
        var clientID_2 = "ClinetID-1";

        var server = new Server( serverKey );
        server.io = new FakeIO();

        var socket_1 = new FakeSocket();
        socket_1.id = clientID_1;
        
        var socket_2 = new FakeSocket();
        socket_2.id = clientID_2;

        // initalize the server
        server.Init();

        // connect the first socket and set the server
        server.io.triggerBindedMessage( "connection", socket_1 );
        socket_1.triggerBindedMessage( "set-server", {key: clientID_1 + serverKey, type: "Type" } );

        // connect the second socket and set the server (which should not happen)
        server.io.triggerBindedMessage( "connection", socket_2 );
        socket_2.triggerBindedMessage( "set-server", {key: clientID_2 + serverKey, type: "Type" } );

        assert.equal( server.serverSocket, socket_1);
        assert.notEqual( server.serverSocket, socket_2 );
        
        done();
    });

    it ( "When a set-server message is received server-available should broadcast the sid and socket type", (done) => {
        
        var clientID = "ClinetID",
        serverKey = "ServerKey";

        var server = new Server( serverKey );
        server.io = new FakeIO();

        var socket = new FakeSocket();
        socket.id = clientID;
        
        // initalize the server and trigger the connection event
        server.Init();
        server.io.triggerBindedMessage( "connection", socket );

        socket.triggerBindedMessage( "set-server", {key: clientID + serverKey, type: "Type" } );

        assert.isTrue( "server-available" in socket.emitedMessageEvents, "server-available not emited" )
        // and it containes the sid and type feilds
        var message = socket.emitedMessageEvents["server-available"];
        assert.isTrue( "sid" in message );
        assert.isTrue( "type" in message );
        
        done();

    } );

    it ( "when a new peer connects if theres a server assigned it should send the peer the servers id and socket type", (done) => {
        
        var clientID_server = "ClinetIDServer";
        var clientID_client = "ClinetIDClient";
        var serverKey = "ServerKey";

        var server = new Server( serverKey );
        server.io = new FakeIO();

        var socket_server = new FakeSocket();
        socket_server.id = clientID_server;
        
        var socket_client = new FakeSocket();
        socket_client.id = clientID_client;

        // initalize the server
        server.Init();
        // connect the sever
        server.io.triggerBindedMessage( "connection", socket_server );
        socket_server.triggerBindedMessage( "set-server", {key: clientID_server + serverKey, type: "Type" } );
        // connect the client 
        server.io.triggerBindedMessage( "connection", socket_client );

        assert.isTrue( "server-available" in socket_client.emitedMessageEvents, "server-available not emited" )
        // and it containes the sid and type feilds
        var message = socket_client.emitedMessageEvents["server-available"];
        assert.isTrue( "sid" in message );
        assert.isTrue( "type" in message );
        
        done();

    } );

    it ( "When the assigned server disconnects, it should be broadcasted to all clients", (done) => {
        
        var clientID_server = "ClinetIDServer";
        var serverKey = "ServerKey";

        var server = new Server( serverKey );
        server.io = new FakeIO();

        var socket_server = new FakeSocket();
        socket_server.id = clientID_server;
        
        // initalize the server
        server.Init();
        // connect the sever
        server.io.triggerBindedMessage( "connection", socket_server );
        socket_server.triggerBindedMessage( "set-server", {key: clientID_server + serverKey, type: "Type" } );

        // prove the server has been set
        assert.equal( server.serverSocket.id, clientID_server );
        // dissconnect the server
        socket_server.triggerBindedMessage( "disconnect", null );
        assert.isTrue( "server-disconnect" in socket_server.emitedMessageEvents );
        done();
    } );

    it ( "When a non server (client) dissconects no message should be broadcasted", (done) => {
        var clientID_server = "ClinetIDServer";
        var clientID_client = "ClinetIDClient";
        var serverKey = "ServerKey";

        var server = new Server( serverKey );
        server.io = new FakeIO();

        var socket_server = new FakeSocket();
        socket_server.id = clientID_server;
        
        var socket_client = new FakeSocket();
        socket_client.id = clientID_client;

        // initalize the server
        server.Init();
        // connect the sever
        server.io.triggerBindedMessage( "connection", socket_server );
        socket_server.triggerBindedMessage( "set-server", {key: clientID_server + serverKey, type: "Type" } );
        // connect the client
        server.io.triggerBindedMessage( "connection", socket_client );

        // prove the server has been set
        assert.equal( server.serverSocket.id, clientID_server );
        // dissconnect the client
        socket_client.triggerBindedMessage( "disconnect", null );
        assert.isFalse( "server-disconnect" in socket_client.emitedMessageEvents );
        done();
    } );

    it ( "when the assigned server disconnects the available server feilds should be reset to null", (done) => {
        var clientID_server = "ClinetIDServer";
        var serverKey = "ServerKey";

        var server = new Server( serverKey );
        server.io = new FakeIO();

        var socket_server = new FakeSocket();
        socket_server.id = clientID_server;
        
        // initalize the server
        server.Init();
        // connect the sever
        server.io.triggerBindedMessage( "connection", socket_server );
        socket_server.triggerBindedMessage( "set-server", {key: clientID_server + serverKey, type: "Type" } );

        // prove the server has been set
        assert.equal( server.serverSocket.id, clientID_server );
        // dissconnect the server
        socket_server.triggerBindedMessage( "disconnect", null );
        assert.isNull( server.serverSocket, "expected server.serverSocket to be null" );
        assert.isNull( server.serverSocketType, "expected server.serverSocketType to be null" );
        done();
    });

    it ( "set-server should set the serverSocketType when a valid server key is received", (done) =>{
        
        var serverKey = "serverKey";
        var clientID = "clientID";
        var socketType = TestPeer.SOCKET_TYPE;

        var server = new Server( serverKey );
        server.io = new FakeIO();

        var socket = new FakeSocket();
        socket.id = clientID;

        server.Init();
        server.io.triggerBindedMessage( "connection", socket );

        socket.triggerBindedMessage( "set-server", {key: clientID + serverKey, type: socketType} )

        assert.isNotNull( server.serverSocketType );

        done();

    } )

});
