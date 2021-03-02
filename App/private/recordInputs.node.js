import fs from "fs";
import { Inputs } from "../common/objects/components/inputs.com.js"

/** 
 * NOTE: this is a strickly expermental method to achive this.
 *       It might be better to use netive js in the long term as 
 *       the press timeings will be more precise
 */
export class RecordInputs extends Inputs {

    constructor( uid, componentOwner, net_sync )
    {

        super( uid, componentOwner, net_sync );

        let date = new Date();
        let d = date.toLocaleDateString().replace( /\//g, "-" );
        let t = date.toLocaleTimeString().replace(/:/g, "-");

        this.fileName = `rec.${d}-${t}.cin`;

        this.record = false;

    }    

    _OnNetworkApply( data={} )
    {
        super._OnNetworkApply( data );

        if ( !this.record ) 
            return;

        try{
            fs.appendFileSync( `./private/-TEST-RECORDINGS/${this.fileName}`, JSON.stringify( data ) +"\n" );
        }catch(err){
            console.error( err )
        }

    }

}