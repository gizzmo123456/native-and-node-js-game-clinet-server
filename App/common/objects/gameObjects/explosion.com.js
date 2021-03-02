import { ComponentManager } from '../../componentManager.com.js';
import { GameObject } from './base/gameObject.com.js';
import { Mesh } from '../components/mesh.com.js';
import { COLLIDER_MODE, RadiusCollider } from '../components/collider.com.js'
import { Tank } from './tank.com.js';

/**
 * This is an empty class for game objects :P
 */
export class Explosion extends GameObject {

    constructor( goid )
    {
        super( goid );

        this.frame = 0; // Only apply damage on the first frame.
        this.damage = 0;

        var radCollider = new RadiusCollider( this, COLLIDER_MODE.TRIGGER )
        radCollider.radius = 1.2;
        radCollider.SetTags("explosion");

        this.animation = {
            intervals: 0.175,
            currentFrameTime: 0,
            frames: [

            ],
            currentFrame: 0,
            maxFrames: 6
        }

        this.animation.frames.push(
            new Mesh(     
                [
                    {x:  0   , y:  1.2  },
                    {x:  0.3 , y:  0.3  },
                    {x:  0.9 , y:  0.9  },
                    {x:  0.45, y:  0.15 },
                    {x:  0.9 , y:  0.0  },
                    {x:  0.3 , y: -0.15 },
                    {x:  0.6 , y: -0.9  },
                    {x:  0.15, y: -0.15 },
                    {x: -0.6 , y: -0.9  },
                    {x: -0.15, y:  0    },
                    {x: -0.6 , y:  0.6  },
                    {x: -0.15, y:  0.3  }
                ], 
                { fillColor: 'orange', borderWidth: 5 },
                radCollider
            )
        )

        this.animation.frames.push(
            new Mesh(     
                [
                    {x:  0   , y:  1  },
                    {x:  0.2 , y:  0.4  },
                    {x:  0.8 , y:  1  },
                    {x:  0.4, y:  0.2 },
                    {x:  0.8 , y:  0.0  },
                    {x:  0.4 , y: -0.1 },
                    {x:  0.6 , y: -0.8  },
                    {x:  0.2, y: -0.2 },
                    {x: -0.5 , y: -1  },
                    {x: -0.2, y:  0.1    },
                    {x: -0.7 , y:  0.7  },
                    {x: -0.1, y:  0.4  }
                ], 
                { fillColor: 'orange', borderWidth: 5 },
                radCollider
            )
        )

        this.animation.frames.push(
            new Mesh(     
                [
                    {x:  0   , y:  1  },
                    {x:  0.3 , y:  0.4  },
                    {x:  0.8 , y:  1  },
                    {x:  0.4, y:  0.2 },
                    {x:  0.8 , y:  0.0  },
                    {x:  0.4 , y: -0.1 },
                    {x:  0.6 , y: -0.8  },
                    {x:  0.2, y: -0.2 },
                    {x: -0.5 , y: -1  },
                    {x: -0.2, y:  0.1    },
                    {x: -0.7 , y:  0.7  },
                    {x: -0.1, y:  0.4  }
                ], 
                { fillColor: 'orange', borderWidth: 5 },
                radCollider
            )
        )
        /*
        this.animation.frames[0].drawAxis = true;
        this.animation.frames[1].drawAxis = true;
        this.animation.frames[2].drawAxis = true;
        */
        // a square :P
        this.meshes.push( this.animation.frames[0]);

    }

    Tick( time_delta_seconds )
    {
        this.frame ++;
        this.animation.currentFrameTime += time_delta_seconds
        if ( this.animation.currentFrameTime > this.animation.intervals )
        {
            this.animation.currentFrame++;
            this.animation.maxFrames--;
            if ( this.animation.maxFrames < 0)
            {
                ComponentManager.Destroy(this);
                return;
            }
            else
            {

                if ( this.animation.currentFrame >= this.animation.frames.length )
                    this.animation.currentFrame = 0


                this.animation.currentFrameTime -= this.animation.intervals;
                this.meshes[0] = this.animation.frames[ this.animation.currentFrame ]

                this.transform.rotation += 160

                this.transform.scale.x -= 0.1;
                this.transform.scale.y -= 0.1;

            }
        }
    }

    OnTrigger( thisCollider, otherCollider, collisionData )
    {
        if ( this.frame > 1) return; // Only apply damage on the first frame.

        if ( otherCollider.GameObject instanceof Tank )
        {
            otherCollider.GameObject.health -= this.damage;
            console.log(otherCollider.GameObject.health)
        }
    }

}