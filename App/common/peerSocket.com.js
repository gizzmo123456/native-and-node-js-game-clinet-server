import {WS_PORT} from './wwwConfig.com.js'

// Base class for WebSocket and WebRTC connections
class PeerSocket
{
    STATUS = {
        INACTIVE: "inactive",
        ACTIVE: "active"
    }

    static SOCKET_TYPE = null;

    constructor( clientID )
    {
        
        this.clientID = clientID;
        this.status = this.STATUS.INACTIVE;
        //this.receivedMessageQueue = []

        this.events = {};   // key = event name, value: list of callbacks. callback params: PeerSocket, Data

    }

    static SetClasses( classes={} ){}
    static CreateServer(){ return null; }

    Init(){}

    BindEvent( eventName, callback )
    {

        if ( eventName in this.events )
            this.events[ eventName ].push( callback );
        else
            this.events[ eventName ] = [ callback ];

    }

    CallEvent( eventName, data )
    {
        if ( !(eventName in this.events ))
            return;

        for ( var i in this.events[ eventName ] );
            this.events[ eventName ][i]( this, data );

    }

    SendMessage( message ){}    // This should be overwriten with active data channels send method.
/*
    *ReceiveMessage(){

        /** Note to self. This is how generator work in js.
         *  var it = a()
         *  var itter = it.next()
         *
         *  while ( !itter.done )
         *  {
         *    console.log( itter.value )
         *    itter = it.next()
         *
         *  }
         */
        /*

        for ( var i in this.receivedMessageQueue )
            yield this.receivedMessageQueue[i]

    }   */

}

export class TestPeer extends PeerSocket{

    static SOCKET_TYPE = "TEST";

    constructor( clientID, rtcPeerConnection_class, rtcSessionDescription_class, rtcDataChannle_class )
    {
        super( clientID );
        this.dataChannels = [ ];
    }

    //RTCPeer 
    CreateDataChannel(){
        this.dataChannels.push("Data Channle")
    }

    async CreateOffer(){}
    async HandleOffer(){}

    async CreateAnswer(){}
    async HandleAnswer(){}

}

export class TestPeer2 extends TestPeer{

    static SOCKET_TYPE = "TEST2";

    constructor( clientID, rtcPeerConnection_class, rtcSessionDescription_class, rtcDataChannle_class )
    {
        super( clientID, rtcPeerConnection_class, rtcSessionDescription_class, rtcDataChannle_class );
    }

}

export class RTCPeer extends PeerSocket
{

    static SOCKET_TYPE = "RTC";

    static _RTCPeerConnection = null;
    static _RTCSessionDescription = null;

    // since this is a common module between native JS and Node js,
    // we must construct with the required WebRTC class constructors 
    // as there only available in natve JS
    constructor( clientID )
    {
        super( clientID );
        
        // Connection
        this.connection = new RTCPeer._RTCPeerConnection();
        
        // TODO: this should only be a single data chanel
        this.dataChannels = [ ];

    }

    static SetClasses( classes={} )
    {
        RTCPeer._RTCPeerConnection = classes["RTCPeerConnection"]
        RTCPeer._RTCSessionDescription = classes["RTCSessionDescription"]
    }

    Init()
    {

        this.connection.addEventListener( "connectionstatechange", event =>{

            var conState = this.connection.connectionState;

            console.log("Connection state changed!", conState);

            // Temp Fix to prevent node close connection issue. see dataChannle.close for more info.
            // NOTE: this takes a few seconds affter the client leaves to be triggered.
            if ( this.status != this.STATUS.INACTIVE && conState != "new" && conState != "connecting" && conState != "connected" ) 
            {
                console.log("Forcing connection to close" )
                this.status = this.STATUS.INACTIVE;
                this.CallEvent( "close", null );
            }

        } );

        // Bind onto dataChannle created event.
        this.connection.addEventListener( "datachannel", event => {
            console.log("Data channel Created!");
            this.BindDataChannel( event.channel, "received-"+this.dataChannels.length );
            this.dataChannels.push( event.channel );
        });

    }

    BindDataChannel( datachannel, name )
    {
        datachannel.addEventListener( "open", e => {

            console.log("Data Channel open", name)

            this.status = this.STATUS.ACTIVE;

            this.CallEvent( "open", null );

        });
        
        // There a know bug in Node.js that is preventing this from being triggered when the node server or client leaves.
        // But only if dataChannel close is not called. 
        // (TODO. add process.on("exit", ...) to the entry points of both node applications. See https://nodejs.org/api/process.html#process_event_exit for process lib info)
        // TODO: When a conection is closed, we should un-bind all the events.... (Same for WS)
        datachannel.addEventListener( "close", e => {   

            if ( this.status == this.STATUS.INACTIVE)
                return;

            console.log("Data Channel Closed::", name)
            this.status = this.STATUS.INACTIVE;
            this.closed = true;

            this.CallEvent( "close", null );

        });

        datachannel.addEventListener( "message", e => {
            //console.log("message received!", name);

            this.CallEvent( "message", e.data );

        });
        
        this.connection.addEventListener("error", e => {
            console.error(`An Error has occord on ${this.clientID}`);

            this.CallEvent( "error", null );

        })

    }

    SendMessage( message ){
        if ( this.dataChannels.length > 0 && this.dataChannels[0].readyState == 'open' )
            this.dataChannels[0].send( message )
    }

    async CreateOffer()
    {
        const offer = await this.connection.createOffer();

        await this.connection.setLocalDescription( new RTCPeer._RTCSessionDescription(offer) );

        return offer;
    }

    /**
     * 
     * @param {*} offer : this RTC connection offer
     * @returns : the anwser of the offer. 
     */
    async HandleOffer( offer )
    {

        await this.connection.setRemoteDescription(
            new RTCPeer._RTCSessionDescription( offer )
        );

        const answer = await this.CreateAnswer();
        await this.connection.setLocalDescription( new RTCPeer._RTCSessionDescription(answer) );

        return answer;

    }

    async CreateAnswer()
    {
        return await this.connection.createAnswer();
    }

    async HandleAnswer( answer )
    {
        console.log( "Received Answer" );

        await this.connection.setRemoteDescription(
            new RTCPeer._RTCSessionDescription( answer )
        );

    }

    CreateDataChannel()
    {

        var chan = this.connection.createDataChannel( "Data", {
            ordered: false,
            maxRetransmits: 0,
            //maxPacketLifeTime: 0
        });

        this.BindDataChannel( chan, "new "+ this.dataChannels.length );

        this.dataChannels.push( chan );

        console.log("Created Data channel");

    }

}

export class WSPeer extends PeerSocket
{

    static SOCKET_TYPE = "WS";
    static _WebSocket = null;

    // since this is a common module between native JS and Node js,
    // we must construct with the required WebSocket class constructor 
    // as its only available in natve JS
    constructor( clientID, wsConnection)
    {
        super( clientID );
        this.connection = wsConnection;

        

        // make node/native consistent 
        if ( !this.connection.on )
        {
            this.connection.on = this.connection.addEventListener;
        }

        this.Bind()
    }

    SetActive()
    {
        // if this peer is connected by the server open will not be called
        // to set the peer active. So we'll do it here in the constructor.
        if ( this.status != this.STATUS.ACTIVE ) 
        {
            this.status = this.STATUS.ACTIVE;
            this.CallEvent( "open", null ); // Open is not called when created by the server.
        }
        
    }

    Bind()
    {
        
        this.connection.on("open", () => {  // this may not emit when server.

            this.status = this.STATUS.ACTIVE;

            this.CallEvent( "open", null );

            console.log("WS connection open to ", this.clientID );
        });

        this.connection.on("message", (message) => {

            if ( message.data ) // native js
                message = message.data

            this.CallEvent( "message", message );

        })

        this.connection.on("close", () => {
            console.log("WS connection closed from", this.clientID );
            this.status = this.STATUS.INACTIVE;

            this.CallEvent( "close", null );

        })

        this.connection.on("error", () => {
            console.error(`An Error has occord on ${this.clientID}`);

            this.CallEvent( "error", null );

        })

    }

    SendMessage( message )
    {
        if ( this.connection.readyState == 1 )
            this.connection.send( message );
        else
            console.log("Unable to send message, connection not open!s");
    }

    static SetClasses( classes={} )
    {
        WSPeer._WebSocket = classes["WebSocket"];
    }

    static CreateServer()
    {
        // WebSocket server is only available in Node.js
        try{
            return new WSPeer._WebSocket.Server( { port: WS_PORT, host: "0.0.0.0" } )
        }catch( e ){
            console.log("Unable to create server", e);
            return null;
        }
    }

    static ConnectToServer( address )
    {
        return new WSPeer._WebSocket(address);
    }

}
