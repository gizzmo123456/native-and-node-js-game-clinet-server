import { BasePacket } from "./Packets/basePacket.com.js";
import { WSPeer } from "./peerSocket.com.js";
import {WWW_ADDRESS, WS_ADDRESS, WS_PORT} from "./wwwConfig.com.js";

export class ConnectionManager{

    /**
     * @param {*} ioSignalingSocket : the io socket
     * @param {Array} rtcPeerSocket : the RTC Peer Socket + constructor values. ( [RTCPeer, [Constructor values]] )
     * @param {Array} websocketPeerSocket: the WebSocket Peer Socket + constructor values. ( [WSPeer, [Constructor values]] )
     * @param {Packet} dataPacket: The Packet constructor that data should be unpacket into.
     * @param {*} maxConnections : the max connections that the manager will alow. This should be 1 for client and >1 for server 
     * @param {*} serverKey : the key that used identify as the server. (This key must match the server key present in singnalling)
     */
    constructor( ioSignalingSocket, rtcPeerSocket, websocketPeerSocket, dataPacket, maxConnections=1, serverKey=null )
    {
        this.SIGNALING = ioSignalingSocket.connect( WWW_ADDRESS );
        this.IS_SERVER = false; // or Host

        // Set the required constructors into the class
        rtcPeerSocket[0].SetClasses( rtcPeerSocket[1] );
        websocketPeerSocket[0].SetClasses( websocketPeerSocket[1] );

        // classes.
        this.classes = {}
        this.classes[ rtcPeerSocket[0].SOCKET_TYPE ] = rtcPeerSocket[0];
        this.classes[ websocketPeerSocket[0].SOCKET_TYPE ] = websocketPeerSocket[0];

        this.SOCKET_TYPE = null;

        this.dataPacket = dataPacket;

        // make sure that clients can only connect to one other peer (aka. the server)
        if ( !serverKey )   
            this.MAX_CONNECTIONS = 1;
        else
            this.MAX_CONNECTIONS = maxConnections;
        
        // Events
        // Open, Close, Message, Error
        // all event have param data?
        this.events = {}    // event name, liast of callbacks;  {eventname: [callback1, callback2]}

        //
        this.serverKey = serverKey; // idenifys the game server
        this.client_id = null;      // this clients id
        this.gameServer_id = null;  // the available server id
        
        this.websocket_server = null;  
        this.connected_peers = {};  // list of peers this client is connected to

    }

    // TODO: Should on be able to call if from the server.
    SetSocketType( socketType )
    {
        if ( this.serverKey != null && this.SOCKET_TYPE == null)
            this.SOCKET_TYPE = socketType;
    }

    Init( socketType = null )
    {

        if ( socketType != null)
            this.SetSocketType( socketType );

        this.SIGNALING.on( "connect", ()=>console.log("Connected to Signaling"));
        this.SIGNALING.on( "disconnect", ()=>console.log("Disconnected from Signaling"));

        this.SIGNALING.on( "cid", (cid) => {
            console.log("My ID is...", cid);
            this.client_id = cid;

            if ( this.SOCKET_TYPE != null && this.serverKey != null )
            {
                this.SIGNALING.emit( "set-server", { key: cid + this.serverKey, type: this.SOCKET_TYPE } );
            }
            else if ( this.SOCKET_TYPE == null && this.serverKey != null )
            {
                console.error( "Unable to emit 'set-server' Socket type has not been set" );
            }

        });

        this.SIGNALING.on( "server-available", async (data) => {

            if ( this.IS_SERVER )
            {
                console.warn("Server received a message to set the avilable server");
                return;
            }

            if ( data.type in this.classes && this.gameServer_id == null )
            {
                this.gameServer_id = data.sid;
                this.SOCKET_TYPE = data.type;

                await this.ConnectToPeer( data.sid );
                console.log("Received available server ID (Type:", data.type, ")");
            }
        });

        this.SIGNALING.on( "server-disconnect", (data) => {

            if ( data == this.gameServer_id )
            {
                this.gameServer_id = null;
                this.SOCKET_TYPE   = null;
                console.log("Server has been unset!");
                console.log(`remaining clients conneected: ${Object.keys(this.connected_peers).length}`)
            }

        } );

        this.SIGNALING.on( "server-set", (data)=>{

            this.IS_SERVER = data.key == this.client_id + this.serverKey && data.type == this.SOCKET_TYPE;

            if ( this.IS_SERVER && this.SOCKET_TYPE != null)
            {
                this.websocket_server = this.GetActiveSocketTypeClass.CreateServer();

                if ( this.websocket_server != null )
                {
                    this.websocket_server.on( "connection", (ws, req) => {

                        var clientID = req.url.substring(1);

                        if ( clientID in this.connected_peers )
                        {
                            console.error("Error: Client Already connected!");
                            ws.terminate();
                            return;
                        }
                        console.log("New WS Client: "+ req.url.substring(1) );

                        // Add the peer to the connected peers.
                        var peer = new WSPeer( clientID , ws );
                        this._BindPeer( peer );
                        peer.SetActive();   // Set active affter binding to peers so open is called.
                        
                        this.connected_peers[ clientID ] = peer;
                        
                    } );
                }
                
                console.log( "I am the desinated server today, how may i help you?")
            }

        })

        this.SIGNALING.on( "connection-offer-made", async (data) => {     // When called

            if( this.SOCKET_TYPE == WSPeer.SOCKET_TYPE)
            {
                console.error("Received connection offer while in WebSocket mode.");
                return;
            }
            else
            {
                console.log("Received Offer");
            }

            var peer = null;

            if ( data.from in this.connected_peers )
            {
                peer = this.connected_peers[ data.from ];
            }
            else
            {
                peer = this.ConstructPeer( data.from )
                this._BindPeer( peer );

                if ( peer == null )
                    return;

                this.connected_peers[data.from] = peer;
                peer.Init();
            }

            var answer = await peer.HandleOffer( data.offer );

            this.SIGNALING.emit( "anwser-connection", {answer, to: data.from} );
            console.log("emited Anwser");

            if ( this.IS_SERVER )   // return the call. (only if we are the server and TODO: using webRTC)
            {
                this.ConnectToPeer(data.from);
            }

        })

        this.SIGNALING.on( "connection-anwser-made", async (data) => {    // 

            if( this.SOCKET_TYPE == WSPeer.SOCKET_TYPE)
            {
                console.error("Received an anwser to a connection while in WebSocket mode.");
                return;
            }
            else
            {
                console.log("Received Answer: From: "+data.from);
            }
            

            await this.connected_peers[data.from].HandleAnswer( data.answer );

        });
    }

    get GetActiveSocketTypeClass( )
    {
        if ( !(this.SOCKET_TYPE in this.classes) )
        {
            console.error(`Unable to construct class: Type not found (${this.SOCKET_TYPE})`);
            return null;
        }

        return this.classes[ this.SOCKET_TYPE ];

    }

    /** TODO: this should be removed. as we dont use it for WSPeers! */
    ConstructPeer( cid )
    {
        if ( !(this.SOCKET_TYPE in this.classes) )
        {
            console.error(`Unable to construct class: Type not found (${this.SOCKET_TYPE})`);
            return null;
        }

        var constructor = this.classes[ this.SOCKET_TYPE ];

        return new constructor( cid );

    }

    async ConnectToPeer(to)
    {

        if ( this.IS_SERVER && this.SOCKET_TYPE == WSPeer.SOCKET_TYPE )
        {
            console.log( "Server can not connect to peer when in WebSocket mode" );
            return;
        }
        else if ( Object.keys(this.connected_peers).length >= this.MAX_CONNECTIONS )
        {
            console.log("Unable to allow connection max connections reached");
            return;
        }

        console.log( "CONNECT to", to );

        if ( this.SOCKET_TYPE == WSPeer.SOCKET_TYPE )
        {

            var ws = WSPeer.ConnectToServer( `ws://${WS_ADDRESS}:${WS_PORT}/${this.client_id}` );   // TODO: share with signaling 
            var wsPeer = new WSPeer( this.client_id, ws );
            this._BindPeer( wsPeer );

            this.connected_peers[ this.client_id ] = wsPeer;

            return; 
        }

        var peer = null;

        if ( to in this.connected_peers )
        {
            peer = this.connected_peers[to];
        }
        else
        {
            peer = this.ConstructPeer( to );
            this._BindPeer( peer );

            if ( peer == null )
                return;

            // Only the peer making the initial connection needs to open the data channel
            // otherwise we end up with two data channels.
            peer.CreateDataChannel();   
            this.connected_peers[to] = peer;
            peer.Init();

        }


        var offer = await peer.CreateOffer();

        this.SIGNALING.emit( "offer-connection", {
            offer,
            to: to
        });

    }

    /** Client ID Helper methods */

    /**
     * Gets the clients peer socket.
     * @param {*} clientID  The ID of the client
     * @return {peerSocket} the clients peer socket if exist otherwise null
     */
    GetClientSocket( clientID )
    {
        if ( clientID in this.connected_peers )
            return this.connected_peers[ clientID ];
        
        return null;
    }

    /**
     * Selects the relevent client ID for setting ownership 
     * based on the client or server context.
     * 
     * If 'IsServer == false' (client)
     * and the clientID matches this clients ID, 
     * then this clients ID is return. Otherwise
     * returns the game servers ID (or null if not set)
     * As far as a client is concerned, if an unknown client ID
     * arrives its owned by the server. Otherwise this client can
     * take controle of the object.
     * 
     * If 'IsServer == true' (server)
     * returns the clientID if it exist in the 
     * 'connected_peers' array or equals this clients ID.
     * Otherwise returns null.
     * 
     * if NULL is return. Its potentially fatle. 
     * 
     * @param {*}   clientID The ID of the client
     */
    SelectClientID( clientID )
    {
        
        if ( this.IS_SERVER && ( clientID == this.client_id || clientID in this.connected_peers ) )
            return clientID;
        else if ( !this.IS_SERVER && ( clientID == this.client_id || clientID == this.gameServer_id ) )
            return clientID;
        else
            return null;
            
    }

    /** Events */
    /** Events are trigger by all connected clients */

    _BindPeer( peerSocket )
    {

        peerSocket.BindEvent( "open",    this.Open.bind(this) );
        peerSocket.BindEvent( "close",   this.Close.bind(this) );
        peerSocket.BindEvent( "error",   this.Error.bind(this) );
        peerSocket.BindEvent( "message", this.Message.bind(this) );

    }

    BindEvent( eventName, callback )
    {

        if ( eventName in this.events )
            this.events[ eventName ].push( callback );
        else
            this.events[ eventName ] = [ callback ];

    }

    _CallEvent( eventName, peerSocket, data )
    {
        if ( !(eventName in this.events ))
            return;

        for ( var i in this.events[ eventName ] )
            this.events[ eventName ][i]( peerSocket, data );

    }

    Open( peerSocket, data )
    {
        this._CallEvent( "open", peerSocket, data );
    }

    Close( peerSocket, data )
    {

        // Remove the peer from the connected clients.
        if ( peerSocket.clientID in this.connected_peers )
        {
            delete this.connected_peers[peerSocket.clientID]; 
            console.log("Peer Remove!");
        }

        this._CallEvent( "close", peerSocket, data );
    }

    Error( peerSocket, data )
    {
        this._CallEvent( "error", peerSocket, data );
    }
    
    /**
     * 
     * @param {*} peerSocket Recevied from peerSocket
     * @param {*} message    Raw Array Buffer
     */
    Message( peerSocket, arrayBuffer )
    {
        // Create a packet from the array buffer

        this._CallEvent( "message", peerSocket, arrayBuffer );
    }
    
    /**
     * broadcast message to all connected peerSockets
     * @param {Int8Array} int8ArrayBuffer packet containing the data to be sent
     */
    Broadcast( arrayBuffer ) // TODO: Change to arrayBuffer
    {
        if ( arrayBuffer.length == 0)
            return ;    // no data to send

        Object.keys( this.connected_peers ).forEach( (key, idx) => {
            this.connected_peers[ key ].SendMessage( arrayBuffer );
        } );

    }

}
