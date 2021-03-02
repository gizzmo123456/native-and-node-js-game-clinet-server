import { Inputs } from "/common/objects/components/inputs.com.js";

export class NativeInputs extends Inputs {

    constructor( uid, componentOwner, net_sync )
    {
        super( uid, componentOwner, net_sync );

        // Reset the inputs if the window looses focuse
        window.addEventListener( "blur", () => {

            var keys = Object.keys( this.keyDown );
            var mButtons = Object.keys( this.mouseDown );

            keys.forEach( element => {
                this.keyDown[ element ] = 0
            })

            mButtons.forEach( element => {
                this.mouseDown[ element ] = 0;
            })

        })

        // bind
        window.addEventListener( "keydown", event => {
            
            this.keyDown[ event.key ] = 1;
            //console.log("Down: ", event.key, "::", this.keyDown[ event.key ] );
        } );

        window.addEventListener( "keyup", event => {
            this.keyDown[ event.key ] = 0;
            //console.log( "UP: ", event.key );
        } );

        window.addEventListener( "mousedown", event => {

            this.mouseDown[ event.button ] = 1;
            //console.log( "MDOWN: ", event.button );
        } );

        window.addEventListener( "mouseup", event => {

            this.mouseDown[ event.button ] = 0;
            //console.log( "MUP: ", event.button );
        } );

        /** TODO: Note this should only to the viewport only */
        window.addEventListener( "mousemove", event => {
            this.mousePosition = {
                x: event.pageX,
                y: event.pageY
            };
            //console.log("MM: ", this.mousePosition );
        } );

    }


}