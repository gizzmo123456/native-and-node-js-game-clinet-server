import fs from "fs";
import { Inputs } from "../common/objects/components/inputs.com.js"

export class PlaybackInputs extends Inputs {

    static __networkIgnoreFeilds = [ ... Inputs.__networkIgnoreFeilds, 
                                     "filename" 
                                   ]

    static INPUTS = null;

    constructor( uid, componentOwner, net_sync )
    {

        super( uid, componentOwner, net_sync );

        this.fileName = `rec.18-01-2021-01-57-50.cin`;

        this.currentInput = 0;
        this.inputs = [];

        this.inputsLoaded = true;//PlaybackInputs.INPUTS != null;
        //if ( this.inputsLoaded )
        //    this.inputs = PlaybackInputs.INPUTS;
        
    }    

    LoadInputs()
    {

        if ( this.inputsLoaded )
            return;
console.log("LOAD INPUTS")
        this.inputsLoaded = true;
        // for now we'll just see how it is loading all inputs in.
        // later it might be necessary to load it in bit by bit.
        // See. https://nodejs.org/api/fs.html#fs_fs_readfile_path_options_callback
        // and. https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options

        
        fs.readFile( `./private/-TEST-RECORDINGS/${this.fileName}`, 'utf-8', (err, data) => {

            if ( err )
            {
                console.error( err );
                return;
            }
            /*this.inputs*/PlaybackInputs.INPUTS = JSON.parse( `[${data}]` );
            // For some reason this causes the RTCdatachannel to close on node.js
            //this.inputs = data.split("\n");
            //console.log( "Inputs", this.inputs.length );
        } );

    }

    // Temp fix for node js client
    static SetInputs( inputs )
    {
        PlaybackInputs.INPUTS = inputs;
    }

    Tick( time_delta_seconds )
    {

        if ( !this.inputsLoaded )
            this.LoadInputs();

        if ( this.currentInput >= PlaybackInputs.INPUTS.length-1 )    // minus 1 as the last line is always empty 
            return;

        //console.log( "Current Input Frame ID:", this.currentInput )
        //console.log( this.mousePosition );
        //console.log( this.inputs[ this.currentInput ] );

        //this.__ApplyInputs( JSON.parse( this.inputs[ this.currentInput ] ) )
        this.__ApplyInputs( PlaybackInputs.INPUTS[ this.currentInput ] )
        this.currentInput++;
    }


    /**
     * Same as _OnNetworkApply except without the networking checks
     * @param {*} data 
     */
    __ApplyInputs( data={} )
    {

        //console.log("Applying:", this.uid, data)

        // Get an catch the network feilds.
        // idealy i would perfer to have this in the constructor however,
        // 'this' is refering to Component rather than inherited class.
        if ( this.constructor.__networkFeilds == null )
            this._RegisterNetworkFeilds();

        Object.keys(data).forEach( element => {
            if ( !this.constructor.__networkIgnoreFeilds.includes( element ) )
                this[ element ] = data[element];
        } );

    }

}