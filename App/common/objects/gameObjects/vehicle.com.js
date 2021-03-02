import { GameGlobals  } from '../../gameManager.com.js'; 
import { Constructors } from '../../constructors.com.js';
import { GameObject } from "./base/gameObject.com.js";

export class Vehicle extends GameObject {

    constructor( goid )
    {
        super(goid);

        this.__constructors[ "inputs" ] = [ Constructors.inputs, [] ]

        this.currentSpeed = 0;
        this.maxSpeed = 2;

        this.acceleration = 0.5;
        this.breakingForce = 6;
        this.friction = 0.3;

        this.__moveDir = {x: 0, y:0}
        this.__dir = 1;

    }

    get RotateSpeed()
    {
        return 11;
    }

    get MinRotateAmount()
    {
        return 0;
    }

    Tick( time_delta_seconds ){

        //this.transform.scale = {x: 1.5, y: 1.5} // For some reason if this is not set, it scales madly....

        if ( !("inputs" in this.components) )
            return;

        // we must tick the inputs in case its the node client
        // which plays back recorded inputs 
        this.components["inputs"].Tick();

        var pressed = 0;
        var moving = this.MinRotateAmount;
        if ( this.currentSpeed != 0 )
            moving = 1

        if ( this.components["inputs"].IsKeyDown( "w" ) )
        {
        
            this.currentSpeed += this.acceleration * (1 - (Math.abs(this.currentSpeed)/this.maxSpeed)) * time_delta_seconds
            pressed = 1
            this.__dir = 1;

        }

        if ( this.components["inputs"].IsKeyDown( "s" ) )
        {
            this.currentSpeed -= this.acceleration * (1 - (Math.abs(this.currentSpeed)/this.maxSpeed)) * time_delta_seconds
            pressed = 1
            this.__dir = -1
        }

        if ( this.components["inputs"].IsKeyDown( " " ) )   // breaking
        {

            if ( this.currentSpeed > 0 )
            {
                this.currentSpeed -= this.breakingForce * time_delta_seconds;

                if ( this.currentSpeed < 0)
                    this.currentSpeed = 0;
            }
            else if ( this.currentSpeed < 0 )
            {
                this.currentSpeed += this.breakingForce * time_delta_seconds;

                if ( this.currentSpeed > 0)
                    this.currentSpeed = 0;
            }
        }

        if ( this.components["inputs"].IsKeyDown( "d" ) )
            this.transform.rotation += this.RotateSpeed * (1+Math.abs(this.currentSpeed)) * time_delta_seconds * moving;

        if ( this.components["inputs"].IsKeyDown( "a" ) )
            this.transform.rotation -= this.RotateSpeed * (1+Math.abs(this.currentSpeed)) * time_delta_seconds * moving;

        
        if ( this.currentSpeed >= this.maxSpeed )
            this.currentSpeed = this.maxSpeed
        else if ( this.currentSpeed <= -this.maxSpeed )
            this.currentSpeed = -this.maxSpeed
        
        if ( pressed == 0 )
        {
            if ( this.currentSpeed > 0)
            {
                this.currentSpeed -= this.friction * time_delta_seconds
                if ( this.currentSpeed < 0 ) this.currentSpeed = 0
            }
            else if ( this.currentSpeed < 0)
            {
                this.currentSpeed += this.friction * time_delta_seconds
                if ( this.currentSpeed > 0 ) this.currentSpeed = 0
            }
        }    

        if ( this.__dir < 0 )
            this.__moveDir = this.transform.Backwards
        else
            this.__moveDir = this.transform.Forwards

        this.transform.position.x += this.__moveDir.x * (this.currentSpeed * this.__dir) * time_delta_seconds
        this.transform.position.y += this.__moveDir.y * (this.currentSpeed * this.__dir) * time_delta_seconds 

        GameGlobals.gameManager.viewport.Position = this.transform.position;
        //GameGlobals.gameManager.viewport.Rotation = this.transform.rotation;

    }

}