import chai from "chai";
import { FakeIO, FakeSocket } from "../testDoubles/IO.Fake.com.js"
import { Server } from "../../signallingServer.node.js"

const assert = chai.assert;
const expect = chai.expect;

describe( "(UNIT) Test io binds onto the required message on init and new sockets bind onto message events", () =>{
    
    it( "binds on to 'connection'", ( done ) => {
        var server = new Server();
        server.io = new FakeIO();

        server.Init();
        assert.isTrue( "connection" in server.io.bindedMessageEvents )
        done();
    });

    it ( "binds socket onto 'set-server' on connection", ( done ) => {
        var server = new Server();
        var socket = new FakeSocket();
        server.io = new FakeIO();
        // initalize the server and trigger the connection event
        server.Init();
        server.io.triggerBindedMessage( "connection", socket );
        assert.isTrue( "set-server" in socket.bindedMessageEvents );
        done();
    });

    it( "binds sockets on to 'offer-connection' on connection", ( done ) => {
        var server = new Server();
        var socket = new FakeSocket();
        server.io = new FakeIO();
        // initalize the server and trigger the connection event
        server.Init();
        server.io.triggerBindedMessage( "connection", socket );
        assert.isTrue( "offer-connection" in socket.bindedMessageEvents );
        done();
    });

    it( "binds sockets on to 'anwser-connection'", ( done ) => {
        var server = new Server();
        var socket = new FakeSocket();
        server.io = new FakeIO();
        // initalize the server and trigger the connection event
        server.Init();
        server.io.triggerBindedMessage( "connection", socket );
        assert.isTrue( "anwser-connection" in socket.bindedMessageEvents );
        done();
    });

    it( "binds sockets on to 'anwser-connection'", ( done ) => {
        var server = new Server();
        var socket = new FakeSocket();
        server.io = new FakeIO();
        // initalize the server and trigger the connection event
        server.Init();
        server.io.triggerBindedMessage( "connection", socket );
        assert.isTrue( "disconnect" in socket.bindedMessageEvents );
        done();
    });

} );

describe( "(UNIT) Test io sockets emits the required message on message events", () =>{

    it( "Does not Emit 'connection-offer-made' on 'offer-connection' message event, if server is not set", ( done ) => {
        var server = new Server();
        var socket = new FakeSocket();
        server.io = new FakeIO();
        // initalize the server and trigger the connection event
        server.Init();
        server.io.triggerBindedMessage( "connection", socket );
        socket.triggerBindedMessage( "offer-connection", {to: "", offer:""} )

        // make sure the server has not been set and the method has not been called
        assert.equal( server.serverSocket, null );
        assert.isFalse( "connection-offer-made" in socket.emitedMessageEvents );
        done();
    });

    it( "Does not Emit 'connection-anwser-made' on 'anwser-connection' message event, if server is not set", ( done ) => {
        var server = new Server();
        var socket = new FakeSocket();
        server.io = new FakeIO();
        // initalize the server and trigger the connection event
        server.Init();
        server.io.triggerBindedMessage( "connection", socket );
        socket.triggerBindedMessage( "anwser-connection", {to: "", offer:""} )

        // make sure the server has not been set and the method has not been called
        assert.equal( server.serverSocket, null );
        assert.isFalse( "connection-anwser-made" in socket.emitedMessageEvents );
        done();
    });

    it( "Emits 'connection-offer-made' on 'offer-connection' message event", ( done ) => {

        var clientID = "ClinetID",
        serverKey = "ServerKey";

        var server = new Server(serverKey);
        var socket = new FakeSocket();
        socket.id = clientID;
        server.io = new FakeIO();
        // initalize the server and trigger the connection event
        server.Init();
        server.io.triggerBindedMessage( "connection", socket );

        socket.triggerBindedMessage( "set-server", {key: clientID + serverKey, type: "Type" } );
        socket.triggerBindedMessage( "offer-connection", {to: "", offer:""} )

        assert.isTrue( "connection-offer-made" in socket.emitedMessageEvents );
        done();
    });

    it( "Emits 'connection-anwser-made' on 'anwser-connection' message event", ( done ) => {
        
        var clientID = "ClinetID",
        serverKey = "ServerKey";

        var server = new Server(serverKey);
        var socket = new FakeSocket();
        socket.id = clientID;
        server.io = new FakeIO();
        // initalize the server and trigger the connection event
        server.Init();
        server.io.triggerBindedMessage( "connection", socket );
        
        socket.triggerBindedMessage( "set-server", {key: clientID + serverKey, type: "Type" } );
        socket.triggerBindedMessage( "anwser-connection", {to: "", offer:""} )

        assert.isTrue( "connection-anwser-made" in socket.emitedMessageEvents );
        done();
    });

    it( "Does not emit 'connection-anwser-made' on 'offer-connection' message event", ( done ) => {
        var server = new Server();
        var socket = new FakeSocket();
        server.io = new FakeIO();
        // initalize the server and trigger the connection event
        server.Init();
        server.io.triggerBindedMessage( "connection", socket );
        socket.triggerBindedMessage( "offer-connection", {to: "", offer:""} )
        assert.isFalse( "connection-anwser-made" in socket.emitedMessageEvents );
        done();
    });

    it( "Emits 'server-set' on 'set-server' if a valid key was received", ( done ) => {

        var clientID = "ClinetID",
        serverKey = "ServerKey";

        var server = new Server( serverKey );
        var socket = new FakeSocket();
        socket.id = clientID;

        server.io = new FakeIO();
        // initalize the server and trigger the connection event
        server.Init();
        server.io.triggerBindedMessage( "connection", socket );
        socket.triggerBindedMessage( "set-server", {key: clientID + serverKey, type: "Type" } );

        assert.isTrue( "server-set" in socket.emitedMessageEvents );

        done();
    });

    it( "Does not Emit 'server-set' on 'set-server' if an invalid key was received", ( done ) => {

        var clientID = "ClinetID",
        serverKey = "ServerKey";

        var server = new Server( serverKey );
        var socket = new FakeSocket();
        socket.id = clientID;

        server.io = new FakeIO();
        // initalize the server and trigger the connection event
        server.Init();
        server.io.triggerBindedMessage( "connection", socket );

        if ( !( "set-server" in socket.bindedMessageEvents  ) )
        {
            assert.fail("Failed to bind onto set-server: unable to receive message in the first place");
            return;
        }

        socket.triggerBindedMessage( "set-server", "AnInvalidKey" );

        assert.isFalse( "server-set" in socket.emitedMessageEvents );
        
        done();
    });

    it( "Emits 'server-available' on connection if server is set", ( done ) => {

        var clientID = "ClinetID",
        serverKey = "ServerKey";

        var server = new Server( serverKey );
        server.io = new FakeIO();

        var serverSocket = new FakeSocket();
        serverSocket.id = clientID;

        var clientSocket = new FakeSocket();

        // initalize the server
        server.Init();

        // connection the server
        server.io.triggerBindedMessage( "connection", serverSocket );

        if ( !( "set-server" in serverSocket.bindedMessageEvents  ) )
        {
            assert.fail("Failed to bind onto set-server: unable to receive message in the first place");
            return;
        }

        serverSocket.triggerBindedMessage( "set-server", {key: clientID + serverKey, type: "Type" } );

        // connect the client to see if the message even is fired
        server.io.triggerBindedMessage( "connection", clientSocket );


        assert.isTrue( "server-available" in clientSocket.emitedMessageEvents );
        
        done();
    });

    it( "Emits 'server-available' to connected clients when middlebox becomes available", ( done ) => {

        var clientID = "ClinetID",
        serverKey = "ServerKey";

        var server = new Server( serverKey );
        server.io = new FakeIO();

        var serverSocket = new FakeSocket();
        serverSocket.id = clientID;

        var clientSocket = new FakeSocket();
        serverSocket.broadcast = clientSocket;
        
        // initalize the server
        server.Init();

        // connect the client to see if the message even is fired
        server.io.triggerBindedMessage( "connection", clientSocket );

        // prove it has not fired yet!
        assert.isFalse( "server-available" in clientSocket.emitedMessageEvents, "message emited befor middlebox connected" );

        // connection the server
        server.io.triggerBindedMessage( "connection", serverSocket );

        if ( !( "set-server" in serverSocket.bindedMessageEvents  ) )
        {
            assert.fail("Failed to bind onto set-server: unable to receive message in the first place");
            return;
        }

        serverSocket.triggerBindedMessage( "set-server", {key: clientID + serverKey, type: "Type" } );

        assert.isTrue( "server-available" in clientSocket.emitedMessageEvents );
        
        done();
    });

});