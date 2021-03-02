import { BasePacket }  from "./basePacket.com.js";
import { GameGlobals } from "../gameManager.com.js" /** OBSOLETE (this cant be supported on the worker)*/

const HEADER_BYTES = 104 / 8;   // = 13 octals

// NOTE/TODO: this might have to be split into a server and a client packet as the headers may differ.
// See. packet.md for further Info
/**
 *  Packet Layout.
 *  {Headers}
 *  [0] Last Received Frame ID  (16bits)
 *  [1] Sent Frame ID           (16bits)  
 *  [2] Last Received Timestamp (32bits)  
 *  [3] Sent Timestamp          (32bits)
 *  [5] fps                     (8bit)
 * =========================================
 *  Header Total bits:          104 bits or 13 octals
 * =========================================
 *  {payload}
 *  [4] Payload.                (remaining bits)
 * 
 */
var TIMERCOUNTER = 0
export class Packet extends BasePacket
{

    static time = {
        lastSentFrameID: -1,                // the frame if of the last sent packet
        lastReceivedFrameID: -1,            // the frame id of the last received frame id
        lastSentFrameTimestamp: -1,         // the last send timestamp
        lastReceivedFrameTimestamp: -1,     // the lst received timestamp
        fps: -1,

        // ???????
        // im thinking that this could be used to slow
        // the the rate of transmission is required
        lastSentFPS: -1,
        lastReceivedFPS: -1,
        // ...
        bufferTimeOffset: 100,   // (100ms = ~6 packets @ 60fps or ~3packets @ 30fps)
        sendReceiveRatio: 2      // 2 to 1 ratio (for clients at least)
    }

    /** (override)
     * Parses a blob into heads and payload
     * @param {ArrayBuffer} arrayBuffer the blob to be parsed 
     */
    async SetFromBuffer( arrayBuffer )
    {
        // NOTE: TODO: this method is sometimes really slow, taking ~30ms - 50ms
        // however most of the time its <5ms
        
        //let tc = TIMERCOUNTER++;
        //console.time(`Set From Buff ${tc}`)
        
        // split the blob into the header and payload bytes
        let header  = arrayBuffer.slice(0, HEADER_BYTES);
        let payload = arrayBuffer.slice(HEADER_BYTES);

        var headerBuffer = header
        var payloadBuffer = payload;

        // Somtimes its a blob and others an array buffer
        // however if its a blob we must extract the array buffer
        if ( header.arrayBuffer )
            headerBuffer = await headerBuffer.arrayBuffer();

        if ( payload.arrayBuffer )
            payloadBuffer = await payload.arrayBuffer();

        this.__ParseHeader( headerBuffer );
        this.__ParsePayload( payloadBuffer );

        // console.timeEnd(`Set From Buff ${tc}`)
        
    }

    /** OBSOLETE */
    SetHeaders()
    {
        let gameManager = GameGlobals.gameManager;

        this.__headers = {
            lastFrameID: 0,
            sentFrameID: gameManager.time.current_frame,
            lastTimestamp: 0,
            sentTimestamp: gameManager.time.timeSinceStart,
            fps: 0
        }
        
    }

    /** (abstract)
     * Creates a buffer containing the packets headers and payload
     * @returns Blob containing the header and payload
     */
    CreateBuffer()
    {

        // make sure the headers have been set.
        if ( this.__headers == null)
            this.SetHeaders();

        // TODO: this can be achived with a single buffer.
        let headerBuffer     = new ArrayBuffer(HEADER_BYTES-1); // the 1 is FPS this must be a multiple of for 4 othrewise it can convert it to an array 32 ffs.

        // convert the header into Uint arrays so they can be packed into the ArrayBuffer
    
        // set last frame and sent frame id into the header
        let frameID      = new Uint16Array(headerBuffer);       // view the buffer in chunks of 2 octals
            frameID[0]   = this.__headers["lastFrameID"];       // 2 octals // 2
            frameID[1]   = this.__headers["sentFrameID"];       // 2 octals // 4

        // Set last and sent timestamps
        let timestamp    = new Uint32Array(headerBuffer);       // view the buffer in chunks of 4 octals
        // the offset remains 1 as the 2 frameIDs make up 32bits
            timestamp[1] = this.__headers["lastTimestamp"];     // 4 octals // 8
            timestamp[2] = this.__headers["sentTimestamp"];     // 4 octals // 12

        // add the frame rate to the end of the header.
        let fps = new Uint8Array(1);
            fps[0] = this.__headers["fps"];                     // 1 octals // 13
        
        // encode the payload
        let payload = BasePacket.encoder.encode( JSON.stringify( this.__payload ) );

        // Pack the data into a Int8 Array ready to be sent
        return new Int8Array([
            ... new Int8Array( headerBuffer ),
            fps[0],
            ... payload
        ])

    }

    /** (override)
     * 
     * @param {ArrayBuffer} arrayBuffer header array buffer
     */
    __ParseHeader( arrayBuffer ) {

        // convert the array buffer to uint 16's 
        let lastFrameID   = new Uint16Array(arrayBuffer, 0 , 1);  // 2 octals // 2
        let sentFrameID   = new Uint16Array(arrayBuffer, 2 , 1);  // 2 octals // 4
        let lastTimestamp = new Uint16Array(arrayBuffer, 4 , 2);  // 4 octals // 8
        let sentTimestamp = new Uint16Array(arrayBuffer, 8 , 2);  // 4 octals // 12
        let fps           = new Uint8Array (arrayBuffer, 12, 1);  // 1 octals // 13

        this.__headers = {};

        this.__headers["lastFrameID"]   = lastFrameID[0];
        this.__headers["sentFrameID"]   = sentFrameID[0];
        this.__headers["lastTimestamp"] = lastTimestamp.reduce( this.__ReduceArray16 );
        this.__headers["sentTimestamp"] = sentTimestamp.reduce( this.__ReduceArray16 );
        this.__headers["fps"]           = fps[0];

    }

    __ReduceArray16(lastValue, currentValue)
    {
        return (lastValue << 16) + (currentValue);
    }

}