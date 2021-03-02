
/**
 * This is an abstract class
 * When extending the BasePacket make sure it is worker thread friendly
 */
export class BasePacket
{

    static encoder = new TextEncoder();
    static decoder = new TextDecoder();

    /**
     * 
     * @param {Blob} blob the blob containing the data to be parshed 
     */
    constructor()
    {

        this.__headers = null; 
        this.__payload = null;

    }

    /** OBSOLETE (abstract)
     * Sets the headers into the packet.
     * this is intended to get and lock in the values ready to be sent.
     * eg.
     * ```
     * this.__headers = {
     *  "currentFrame":  GameGlobals.gameManager.time.current_frame,
     *  "frameTime": GameGlobals.gameManager.time.timeSinceStart
     * };
     * ```
     */
    SetHeaders(){}

    set Headers( headers )
    {
        this.__headers = headers;
    }
    /**
     * Gets the headers array
     */
    get Headers(){

        if ( this.__headers == null)
            console.warn( "Unable to get headers. Not Set");

        return this.__headers;
    }

    /**
     * Set the payload
     * Beweare this overwrites the current payload
     */
    set Payload( payload )
    {
        if ( this.__payload != null)
            console.warn( "Overwriting payload");

        this.__payload = payload;
    }

    /**
     * Get the payload object (data structure)
     */
    get Payload(){

        if ( this.__payload == null)
            console.warn( "Unable to get payload. Not Set");

        return this.__payload;
    }

    get HasPayload()
    {
        return this.__payload != null; 
    }

    /** (abstract)
     * Parses a blob into heads and payload
     * @param {Blob} blob the blob to be parsed 
     */
    async SetFromBuffer( blob ){}

    /** (abstract)
     * Creates a blob containing the packets headers and payload
     * @returns Blob containing the header and payload
     */
    CreateBuffer(){}

    /** (abstract)
     * 
     * @param {ArrayBuffer} arrayBuffer 
     */
    __ParseHeader( arrayBuffer ) {}

    /** (virtual)
     * Default: converts JSON string stored as an uint8array to an object
     * @param {ArrayBuffer} arrayBuffer 
     */
    __ParsePayload( arrayBuffer )
    {

        let str = BasePacket.decoder.decode( arrayBuffer );
        
        this.__payload = JSON.parse( str );

    }

}