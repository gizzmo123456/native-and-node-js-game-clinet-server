
import { ComponentManager } from '../../componentManager.com.js';
import { GameObject } from './base/gameObject.com.js';
import { Explosion } from './explosion.com.js';
import { Mesh } from '../components/mesh.com.js';
import { COLLIDER_MODE, RadiusCollider } from '../components/collider.com.js';  // this needs to be a convex when implermented

export class Missile extends GameObject {

    constructor( goid )
    {
        super( goid );

        this.explosionDamage = 10;
        this.start_speed = this.speed = 14;//18;
        this.flameAnimation = {
            fps: 15,
            frameInterval: 0,
            currentframeTime: 0,
            meshPoints: [],
            update: flame_mesh => {
                // start on the second point as they are the base points
                for (let i = 2; i < flame_mesh.points.length; i++ )
                {
                    let min = {x: this.flameAnimation.meshPoints[i].x - 0.1, y: this.flameAnimation.meshPoints[i].y - 0.005 }
                    let max = {x: this.flameAnimation.meshPoints[i].x + 0.1, y: this.flameAnimation.meshPoints[i].y + 0.1 }
                    let value = {
                        x: this.flameAnimation.meshPoints[i].x , 
                        y: flame_mesh.points[i].y + (-0.0075 + (Math.random() * 0.1))
                    }

                    if ( this.flameAnimation.meshPoints[i].y < -0.2)
                        value.x += (-0.1 + (Math.random() * 0.2))
                    //console.log( value );
                    flame_mesh.points[i].x = this.Clamp( min.x, value.x, max.x );
                    flame_mesh.points[i].y = this.Clamp( min.y, value.y, max.y );


                }

            }
        }
        
        this.flameAnimation.frameInterval = 1 / this.flameAnimation.fps
        this.ignoreCollider = null;

        var radCollider = new RadiusCollider( this, COLLIDER_MODE.TRIGGER, {x: 0, y: 0.7} )
        radCollider.radius = 0.2;

        // wings
        this.meshes.push( new Mesh(     
            [
                {x: -0  , y: 0.65 },  
                {x:  0.4, y:  0  },
                {x: -0.4, y:  0  },
            ], 
            { fillColor: '#ff0000', borderWidth: 5 },
            null
        ));

        // body
        this.meshes.push( new Mesh(     
            [
                {x: -0.175, y:  0.6 },
                {x:  0    , y:  0.9 },
                {x:  0.175, y:  0.6 },
                {x:  0.175, y: -0.1 },
                {x: -0.175, y: -0.1 },
            ], 
            { fillColor: '#888888', borderWidth: 5 },
            radCollider
        ));

        this.meshes[1].drawAxis = true;

        // store the flame mesh points so we can apply 
        // a random number to animate the positions
        this.flameAnimation.meshPoints = [
            {x:  0.125, y:  -0.1 },
            {x: -0.125, y:  -0.1 },
            {x: -0.4  , y:  -0.55 },
            {x: -0.1  , y:  -0.25 },
            {x: 0     , y:  -0.8 },
            {x: 0.1   , y:  -0.25 },
            {x: 0.4   , y:  -0.55 },
        ];

        // make a copy of the flameAnimation mesh so we dont modify the original copy
        let tempMesh = [ ]
        for ( let i in this.flameAnimation.meshPoints )
            tempMesh.push( { ... this.flameAnimation.meshPoints[i] } );

        this.flame_mesh = new Mesh( 
            tempMesh,
            { fillColor: '#ff8c00', borderWidth: 5},
            null )

        this.meshes.push( this.flame_mesh );

    }

    Tick( time_delta_seconds )
    {
        
        this.flameAnimation.currentframeTime += time_delta_seconds;

        if ( this.flameAnimation.currentframeTime > this.flameAnimation.frameInterval )
        {
            this.flameAnimation.currentframeTime -= this.flameAnimation.frameInterval;
            this.flameAnimation.update( this.flame_mesh );
        }

        
        //let rotSpeed = ;
        let scaleSpeed = 0.8 * time_delta_seconds;
        let speed = this.Clamp(0, this.speed * time_delta_seconds, this.start_speed);

        this.speed -= (0.4 + (this.start_speed - this.speed * 0.2)) * time_delta_seconds 
        this.speed = Math.max(0, this.speed);
        
        let frw   = this.transform.Forwards;
 
        this.transform.position.x += speed * frw.x
        this.transform.position.y += speed * frw.y


        //if ( this.transform.scale.x < 0.7 )
        //    return  // explode
        this.transform.scale.x = 0.7 + 0.3 * (this.speed/this.start_speed);
        this.transform.scale.y = 0.7 + 0.3 * (this.speed/this.start_speed);

        if ( speed < 0.05)
        {
            ComponentManager.Destroy(this);
            let go = ComponentManager.Create( Explosion, GameObject.COMPONENT_INIT_MODES.LOCAL )
            if ( go )
            {
                go.transform.position = this.transform.position
                go.damage = this.explosionDamage;
            }

        }

    }

    OnTrigger( thisCollider, otherCollider, collisionData )
    {
        if ( otherCollider == this.ignoreCollider ) return;

        if ( otherCollider.ContainsTag( "explosion" ) ) return;

        this.speed = 0;

    }

    Clamp(min, value, max)
    {

        return Math.max(min, Math.min(value, max));
    }

}