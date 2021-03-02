export const TARGETS = {
    WORKER: "worker",
    MAIN:   "main"
}

export const TYPES = {
    INIT:           "init",             // initalizes the worker thread
    RELEASE:        "release",          // (inbound message ) releases the next queued message to the main thread
    //UPDATE:         "update",         // Updates the thread with the current fame times, so packets can be released in a timely manner
    TO_PACKET:      "packet",           // Creates a packet from an array buffer
    TO_ARRAYBUFFER: "buffer"            // Creates an array buffer from a packet
}

export class PacketHander{

    constructor( thisself, packetClass ){

        this.initalized = false;
        this.haulted = false;

        //this.nextFrameTime = 0; // the time the next frame will begin
        // how much time did the last message take to apply.
        // in other words do we have enough time to apply the packet
        // or should we wait till the next tick.
        //this.lastApplyLength = 0;   

        this.packetQueue = [];

        this.self = thisself
        this.packetClass = packetClass;     // The packetClass must be imported in the (node/native js) wraper since the paths are slighly different

        this.self.onmessage = this.OnMessage.bind(this);    // we must bind this when working on a thread

        this.self.onerror = async function(event)
        {
            console.error(await event)
        }

    }

    async OnMessage( event )
    {
        //console.log("Thread Receive:", event.object)
        
        let target = event.data.target;

        if ( target != TARGETS.WORKER ) return;

        let type = event.data.type;
        let data = event.data.object;

        if ( !this.initalized && type != TYPES.INIT )
        {
            console.error("Unable to process event in packet handler worker. Not Initialized");
            return;
        }
        else if ( this.initalized && type == TYPES.INIT )
        {
            console.error("Unable to initialize packet handler worker. Already Initialized");
            return;
        }

        switch( type )
        {
            case TYPES.INIT:
                
                // We should do stuff here :P
                this.initalized = true;

            break;
            
            case TYPES.RELEASE:
                //TODO: we should proberly tell the main thread that theres no packets.
                if ( this.packetQueue.length > 0 )
                {
                    this.SendToMain( TYPES.TO_PACKET, this.packetQueue.shift(), this.packetQueue.length );
                }
            break;
            // case TYPES.UPDATE:
            //    this.nextFrameTime = data.nextFrameTime;
            //    this.lastApplyLength = data.lastApplyLength;
            // break
            case TYPES.TO_PACKET:
                this.ToPacket( data.arrayBuffer )
                break;
            case TYPES.TO_ARRAYBUFFER:
                this.SendToMain( TYPES.TO_ARRAYBUFFER, this.ToArrayBuffer( data.headers, data.payload ) )
            break;
            default:
                console.error("Unreconized TYPE in packetHander worker thread");
        }

    }

    async ToPacket( arrayBuffer )
    {

        let packet = new this.packetClass();
        await packet.SetFromBuffer( arrayBuffer );

        if ( packet.HasPayload )
            this.packetQueue.push( { Headers: packet.Headers, Payload: packet.Payload } )

    }

    ToArrayBuffer( headers, payload )
    {
        
        let packet = new this.packetClass();
        packet.Headers = headers;   // this method is not reall atm :(
        packet.Payload = payload;

        return { arrayBuffer: packet.CreateBuffer() };

    }

    SendToMain(type, data, queueSize=-1)
    {
        let dataToSend = {
            target: TARGETS.MAIN,
            type: type,
            object: data,
            queueSize: queueSize
        }

        this.self.postMessage( dataToSend )

    }

}
