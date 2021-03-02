

import { Mesh } from '../components/mesh.com.js';
import { Vehicle }    from "./vehicle.com.js";
import { COLLIDER_MODE, RadiusCollider } from '../components/collider.com.js';

export class Car extends Vehicle {

    constructor( goid )
    {
        super( goid );

        this.maxSpeed     = 5;
        this.acceleration = 3.75

        // Get a random colour for the vehicle
        const hexString = "0123456789abcdef";
        this.colour = "#";
        for( var i = 0; i < 6; i++ )
            this.colour += hexString[ Math.floor(Math.random() * 16) ];


        /** 
         *  mesh could be its own component, 
         *  But for this that would add more  
         *  complexity than nessesary
         */
        // array of 2d vector, in local space to a scale of one.
        // ie a box.
        // -0.5, 0.5; 0.5, 0.5;
        // -0.5,-0.5; 0.5,-0.5; and back to the start 
        // -0.5, 0.5; (to close it off)

        // Front Wheels
        var radCollider = new RadiusCollider( this, COLLIDER_MODE.TRIGGER )
        radCollider.radius = 0.5/1.5;

        this.meshes.push( new Mesh(     
            [
                {x: -0.3, y: 0.45 },
                {x:  0.3, y: 0.45 },
                {x:  0.3, y: 0.2 },
                {x: -0.3, y: 0.2 },
            ], 
            { fillColor: "#000000" }
        ));

        // Rear Wheels
        this.meshes.push( new Mesh(     
            [
                {x: -0.315, y: -0.2 },
                {x:  0.315, y: -0.2 },
                {x:  0.315, y:  0.05 },
                {x: -0.315, y:  0.05 },
            ], 
            { fillColor: "#000000" }
        ));

        // Body
        this.meshes.push( new Mesh(     
            [
                {x: -0.25, y: 0.6 },
                {x:  0   , y: 0.65},
                {x:  0.25, y: 0.6 },
                {x:  0.25, y: -0.3 },
                {x: -0.25, y: -0.3 },
            ], 
            { fillColor: this.colour, borderWidth: 4 },
            radCollider
        ));

        // Front Window
        this.meshes.push( new Mesh(     
            [
                {x: -0.2, y: 0.35},
                {x:  0.2, y: 0.35},
                {x:  0.2, y: 0.2 },
                {x: -0.2, y: 0.2 },
            ], 
            { fillColor: "#00ABFF", borderWidth: 3 }
        ));

        // rear Window
        this.meshes.push( new Mesh(     
            [
                {x: -0.2, y: -0.05},
                {x:  0.2, y: -0.05},
                {x:  0.2, y: -0.25},
                {x: -0.2, y: -0.25},
            ], 
            { fillColor: "#00ABFF", borderWidth: 3 }
        ));
        /*

            var radCollider = new RadiusCollider( this, COLLIDER_MODE.TRIGGER )

           this.meshes.push( new Mesh(     
            [
                {x: -0.5, y: -0.5 },
                {x:  0   , y: -0.65},
                {x:  0.5, y: -0.5 },
                {x:  0.5, y:  0.5 },
                {x: -0.5, y:  0.5 },
            ], 
            { fillColor: this.colour },
            radCollider
        ));
        */
    }

    OnTrigger(  )
    {
        
    }

}