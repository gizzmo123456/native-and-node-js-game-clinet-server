import { ComponentManager } from "./componentManager.com.js";
import { TARGETS, TYPES } from "./Packets/packetHandler.worker.com.js"

export class GameGlobals
{
    static DEBUG = false;
    static gameManager = null;
    static connectionManager = null;
    static activeScene = null;
}

export class GameManager
{

    /**
     * @param {ConnectionManager} connectionManager the connection manager to enable online functionality
     * @param {Worker} packetWorker worker thread running the packetHandler
     * @param {*} viewport The viewport to used to render suff :P
     */
    constructor( fps, viewport, connectionManager=null, packetWorker=null, DEBUG=false )
    {
        // overwrite the console methods to prevent loging
        GameGlobals.DEBUG = DEBUG;
        if ( !DEBUG )   
        {
            console.logAnyway = console.log;
            console.log = function(){};
            console.warn = function(){};
            console.error = function(){};
        }

        this.ticking = false;

        this.time = {
            targetFPS: fps,
            updateIntervals: 1000/fps,
            tickStart: 0,
            nextTick: 0,
            delta: 0,
            current_frame: 0,
            framesDroped: 0,
            __timeOffset: 0,             // The amount of ms that we are ahead or behid the target rate.
            __startTime: -1,             // Time the game start (at least init was called)
            TimeSinceInit: () => {       // This is the slightly more precise time since start
                if ( this.ticking )
                    return Date.now() - this.time.__startTime;
                else
                    return 0;
            },
            timeSinceStart: 0           // Time since start, accumulated from the tick delta time. (has a margin of error around -1ms)
        }

        this.fps = {
            interval: 1000, //ms
            currentInterval: 0,
            frames: 0
        }

        this.lastApplyLength = 0;

        // Set singletons ( Game Globals )
        GameGlobals.gameManager       = GameGlobals.gameManager || this;
        GameGlobals.connectionManager = GameGlobals.connectionManager || connectionManager;
        this.packetWorker             = packetWorker;

        // Set Required Components
        this.viewport = viewport;

        // initialize the componet manager so the create and destroy network methods are binded correctly.
        ComponentManager.Init();    
        
        this.events = {}    // key: event name, value: [callbacks]  

        if ( this.packetWorker != null )
        {
            // in nodejs it uses on and in natave js it uses addEventListener
            // We must add 'on' to native js as node may already has AddEventListener for somthink else
            this.packetWorker.on = packetWorker.on || packetWorker.addEventListener;

            this.PacketWorkerSend( TYPES.INIT )
            this.packetWorker.on( "message", this.PacketWorkerReceive.bind(this) )
        }

        // Bind receive message onto the componentManagers Network Apply
        if ( GameGlobals.connectionManager != null )
        {
            
            GameGlobals.connectionManager.BindEvent( "message", (peerSocket, arrayBuffer) => {
                this.PacketWorkerSend( TYPES.TO_PACKET, {arrayBuffer: arrayBuffer} )
            } );

            GameGlobals.connectionManager.BindEvent( "open", ( peerSocket, data ) => {
                // trigger the network connection open on the component manager to send the initial payload to the client.
                ComponentManager.OnNetworkConnectionOpen( peerSocket, data );
                this._CallEvent("clientJoin", [peerSocket] );
               
            } );

            GameGlobals.connectionManager.BindEvent( "close", ( peerSocket, data ) => {
                this._CallEvent("clientLeave", [peerSocket] )
            } );

        }

    }

    /**
     * Events :
     * 'tick' : No Params
     * Called evey tick
     * 
     * 'statistics' : fps, avg delta time (ms)
     * Called when fps.currentInterval exceeds the fps.interval
     * 
     * 'clientJoin' : peerSocket
     * Called when a new connection is opened
     * 
     * 'clientLeave': peerSocket
     * Called when an existing connection is closed
     * @param {*} eventName The event name to bind onto
     * @param {*} callback  The callback method
     */
    BindEvent( eventName, callback )
    {
        if ( eventName in this.events )
            this.events[ eventName ].push( callback )
        else
            this.events[ eventName ] = [ callback ];
            
    }

    _CallEvent( eventName, params = [] )
    {
        if ( !( eventName in this.events ))
            return;

        for ( var i in this.events[ eventName ] )
            this.events[ eventName ][i]( ... params );

    }

    Init()
    {

        if ( this.ticking ) 
        {
            console.error("Can not initialize GameManager. Already ticking");
            return;
        }

        this.ticking = true;
        this.time.__startTime = this.time.nextTick = Date.now();
        this.Tick();

    }

    /**
     * 
     * @param {*} SceneType The scene class type to load.
     */
    LoadScene( sceneType )
    {
        if ( GameGlobals.activeScene != null )
        {
            console.warn("Unloading activing scene, so the new scene can be loaded. (Only supports a single loaded scene)");
            GameGlobals.activeScene.UnloadScene();
        }
        // create the scene and bind the client join/leave methods
        // and finaly load and initalize the scene.
        var scene = GameGlobals.activeScene = new sceneType();

        // Set the background into the viewport.
        this.viewport.SetBackground( scene.Background )

        this.BindEvent( "clientJoin", scene.OnClientJoin.bind( scene ) );
        this.BindEvent( "clientLeave", scene.OnClientLeave.bind( scene ) );

        scene.LoadScene();
        scene.Init();

    }

    TickResolver()
    {
        // key track of how far ahead or behind of the target fps.
        if ( this.time.current_frame > 0)
            this.time.__timeOffset += this.time.delta - this.time.updateIntervals;

        // if we fall behind by more than an one update we must
        // drop the frames and correct the next update time
        if ( this.time.__timeOffset > this.time.updateIntervals )
        {
            var dropFrames = Math.floor( this.time.__timeOffset / this.time.updateIntervals );
            var correction = dropFrames * this.time.updateIntervals;

            //console.warn(`NT time: ${this.time.nextTick} Now: ${Date.now()} Diff: ${Date.now() - this.time.nextTick} Delta: ${this.time.delta} Frames Droped: ${dropFrames} - Correction: ${correction}`);

            this.time.framesDroped += dropFrames;
            this.time.__timeOffset -= correction;
            this.time.nextTick += correction;

        }
            
        // if the time exceds the threshold, attemp to correct it 
        // by atmost the Max Offset Correction
        let offset = 0;
        const threshold = this.time.updateIntervals/250;
        const maxOffsetCorrention = this.time.updateIntervals/150;

        if ( this.time.__timeOffset > threshold)
            offset = Math.min(this.time.__timeOffset - threshold, maxOffsetCorrention);

        var wait = this.time.nextTick - Date.now() - offset;

        //console.log( `${wait} : ${this.time.tickStart} + ${this.time.updateIntervals} - ${Date.now()} - ${offset} :: DELTA REMAIN: ${this.time.__timeOffset}` )

        if ( wait < 0 )
            wait = 0
        //else if ( wait > 20 )
        //    console.warn("Wait is to long: ", wait);

        // resolves with the next frame ID.
        return new Promise( resolve => {
            setTimeout( () => {
                resolve( this.time.current_frame + 1 );
            }, wait);   
        } );

    }

    async Tick()
    {
        var ticker = null;

        while ( this.ticking )
        {
            
            this.ReleasePacket();

            // dont wait for the first tick.
            if ( ticker != null)
            {
                this.time.current_frame = await ticker;
            }

            var previousTickStart = this.time.tickStart;
            this.time.tickStart = Date.now();
            this.time.nextTick += this.time.updateIntervals;

            if ( this.time.current_frame > 0)
                this.time.delta = this.time.tickStart - previousTickStart;

            this.time.timeSinceStart += this.time.delta;

            var deltaTimeSeconds = this.time.delta / 1000;

            // Clear the colliders and renderer
            this.viewport.Clear();
            
            // Dont tick game objects on the first frame, since the delta time is zero
            if ( this.time.current_frame > 0 )
                // Tick all game objects and pass them into the viewport to be processed for rendering
                Object.keys( ComponentManager.allObjects ).forEach( element => {
                    let go = ComponentManager.allObjects[ element ];
                    if ( go ) // in case its been destroyed 
                    {
                        go.Tick( deltaTimeSeconds );
                        this.viewport.ProcessGameObject( go );
                    }
                });

            this._CallEvent( "tick", [ deltaTimeSeconds ] )

            ticker = this.TickResolver();

            // Collect data and broadcast data.
            if ( GameGlobals.connectionManager != null )
                this.PacketWorkerSend( TYPES.TO_ARRAYBUFFER, {
                    headers: {
                        lastFrameID: 0,                             // the lsat recevied frame id
                        sentFrameID: this.time.current_frame,       // the current frame id
                        lastTimestamp: 0,                           // the last received frame timestamp.
                        sentTimestamp: this.time.timeSinceStart,     // the current frames timestamp (at start of frame)
                        fps: Math.ceil( 1/deltaTimeSeconds )
                    }, payload: ComponentManager.NetworkCollect() 
                } );

            this.StatisticsUpdate( this.time.delta, this.time.timeSinceStart );

        }

    }

    StatisticsUpdate( time_delta, time_since_start )
    {
        
        this.fps.currentInterval += time_delta;
        this.fps.frames++;

        if ( this.fps.currentInterval > this.fps.interval )
        {
            var goCount = Object.keys( ComponentManager.allObjects ).length;

            var fps = ( this.fps.frames * ( 1000 / this.fps.currentInterval ) ).toFixed(2);
            var avgDeltaTime = (this.fps.currentInterval / this.fps.frames).toFixed(2);

            this._CallEvent( "statistics", [ fps, avgDeltaTime, (time_since_start/1000).toFixed(1), goCount ] )

            this.fps.frames = 0;
            this.fps.currentInterval = 0;

        }

    }

    /** sends a messages into the packet worker askig to release the next packet in the queue */
    ReleasePacket()
    {
        this.PacketWorkerSend( TYPES.RELEASE, {} )
    }

    /**
     * Receive a message from the packet worker
     * @param {*} data 
     */
    PacketWorkerReceive( event )
    {
        if (GameGlobals.DEBUG && !this.max)
            this.max = 0;
        // in node event is the data, 
        // in native js event is the event that contains the data
        let data = event;

        if ( !data.object )
            data = event.data;

        // handle message
        if ( data.target != TARGETS.MAIN )
            return;

        switch( data.type ){
            case TYPES.TO_PACKET:   // packets are only released when Release Packet is called!
                //if ( data.queueSize > 0)
                //    this.ReleasePacket();
                // TODO: we should maybe time this method to we can make an 
                // estimation on wheater or not theres enought time for the
                // packet to be applied.
                var startApplyTime = Date.now();
                ComponentManager.NetworkApply( data.object );
                this.lastApplyLength = Date.now() - startApplyTime;
                console.logAnyway( "lal: ", this.lastApplyLength )
                // release the next packet if theres more than 1ms till the next tick.
                if ( data.queueSize > 0 && Date.now() + this.lastApplyLength + 1 < this.time.nextTick )
                {
                    this.ReleasePacket();
                }

            break;
            case TYPES.TO_ARRAYBUFFER:
                let bytes = data.object.arrayBuffer.byteLength;
                if ( GameGlobals.DEBUG )
                {
                    this.max = Math.max( this.max, bytes )
                    console.log("AB Packet size:", bytes, "; max:", this.max )
                }
                
                if ( GameGlobals.connectionManager != null )
                    GameGlobals.connectionManager.Broadcast( data.object.arrayBuffer );
            break;
            default:
                console.error("Unreconized TYPE in packetHander worker thread");
        }
    }

    /**
     * Post a message to be handled on the packet worker
     * @param {object} data 
     */
    PacketWorkerSend( type, data )
    {
        let dataToSend = {
            target: TARGETS.WORKER,
            type: type,
            object: data
        }
        
        this.packetWorker.postMessage( dataToSend )
        //console.log("Sent to worker!");
    }

}