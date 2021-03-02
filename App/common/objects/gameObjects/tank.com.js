
import {ComponentManager} from "../../componentManager.com.js"
import { Mesh } from '../components/mesh.com.js';
import { Vehicle }    from "./vehicle.com.js";
import { COLLIDER_MODE, RadiusCollider, PollygonCollider } from '../components/collider.com.js';
import { Explosion } from "./explosion.com.js";

export class Tank extends Vehicle {

    constructor( goid )
    {
        super( goid );

        // Get a random amount od green colour for the vehicle
        var hexString = "0123456789abcdef";
        this.greenChan = "";
        for( var i = 0; i < 2; i++ )
            this.greenChan += hexString[ Math.floor(Math.random() * 16) ];

        this.firePressed = false;
        this.health = 100;

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

        // this needs to be a convex
        //this.radCollider = new RadiusCollider( this, COLLIDER_MODE.TRIGGER )
        //this.radCollider.radius = 0.65;
        this.radCollider = new PollygonCollider( this, COLLIDER_MODE.TRIGGER )
        // Left Tracks
        this.meshes.push( new Mesh(     
            [
                {x: -0.35, y: -0.5 },
                {x: -0.15, y: -0.5 },
                {x: -0.15, y:  0.5 },
                {x: -0.35, y:  0.5 },
            ], 
            { fillColor: "#000000", borderWidth: 5 }
        ));

        // Right Tracks
        this.meshes.push( new Mesh(     
            [
                {x: 0.35, y: -0.5 },
                {x: 0.15, y: -0.5 },
                {x: 0.15, y:  0.5 },
                {x: 0.35, y:  0.5 },
            ], 
            { fillColor: "#000000", borderWidth: 5 }
        ));

        // Body
        this.meshes.push( new Mesh(     
            [
                {x: -0.3, y:  0.45 },
                {x:  0  , y:  0.5  },
                {x:  0.3, y:  0.45 },
                {x:  0.3, y: -0.45 },
                {x: -0.3, y: -0.45 },
            ], 
            { fillColor: `#44${this.greenChan}11`, borderWidth: 5 },
            this.radCollider
        ));

        //this.meshes[ this.meshes.length-1 ].drawAxis = true;

        this.turret = null;

    }

    get RotateSpeed()
    {
        return 15;
    }

    get MinRotateAmount()
    {
        return 0.75;
    }

    Tick( deltaTimeSeconds )
    {

        if ( this.health <= 0 && this.scene != null )
        {
            // expload and destroy.
            let explosion = this.scene.Create( Explosion )
            explosion.transform.position = this.transform.position;
            explosion.damage = 0;
            explosion.transform.scale = {x: 2, y: 2}

            this.scene.Destroy( this );
            this.scene.Destroy( this.turret );
            return;
        }

        super.Tick( deltaTimeSeconds );
        // The Turret must be spwaned affer constructor so it is draw in the correct order.
        // TODO: add a method that is called just affter the constructor.
        if ( this.turret == null )
        {
            return;
        }

        this.turret.transform.position = {
            x: this.transform.position.x - this.transform.Forwards.x * 0.125,
            y: this.transform.position.y - this.transform.Forwards.y * 0.125
        };

        if ( "inputs" in this.components)
        {
            // Set the turts angle. 
            // TODO: sync turet 
            // TODO: I need to find a way to get the view port size!
            let angle = Math.atan2( -(this.components["inputs"].mousePosition.y-350), this.components["inputs"].mousePosition.x-600 )
            this.turret.transform.rotation = (angle * 180/Math.PI)+90 ;

            let pressed = this.components["inputs"].IsMouseDown( 0 );

            if ( !this.firePressed && pressed )
            {
                this.turret.FireMissile();
                this.firePressed = true;
            }
            else if  ( !pressed )
            {
                this.firePressed = false;
            }

        }
    }

    OnTrigger( thisCollider, otherCollider, collisionData )
    {
        //console.log("Hit");
        /*
        if ( otherCollider.ContainsTag( "explosion" ) )
        {
            this.health -= 10;
            console.log( this.health )
        }
        */
    }

}