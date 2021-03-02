import { Component } from './base/component.com.js';
import { Matrix3x3 } from './base/Matrix3x3.com.js';

export class Transform extends Component
{

    static networkConstructorMode = Component.NETWORK_CONSTRUCTOR_MODES.ALWAYS;

    constructor( uid, componentOwner, net_sync )
    {
        super( uid, componentOwner, net_sync );

        this.position = {
            x: 0,
            y: 0
        }

        this.rotation = 0;

        this.scale = {
            x: 1,
            y: 1
        }

    }

    get Forwards()
    {
        return this.TransformDirection ( {
            x: 0,
            y: 1
        });
    }

    get Backwards()
    {
        return this.TransformDirection ( {
            x: 0,
            y: -1
        });
    }

    get Left()
    {
        return this.TransformDirection ( {
            x: -1,
            y: 0
        } );
    }

    get Right()
    {
        return this.TransformDirection ( {
            x: 1,
            y: 0
        } );
    }

    RotatePointByTransform( local_v2 )
    {
        return Transform.RotatePoint( local_v2, this.rotation );
    }

    TransformDirection( direction_v2 )
    {

        let transformMatrix = new Matrix3x3();
        transformMatrix.SetRotation( this.rotation );

        return transformMatrix.Multiply( direction_v2.x, direction_v2.y );
    }

    /**
     * @param {*} local_v2 Vector2 in local space
     * @param {*} angle in degrese 
     */
    static RotatePoint( local_v2, angle )
    {

        let transformMatrix = new Matrix3x3();
        transformMatrix.SetRotation( angle );

        return transformMatrix.Multiply( local_v2.x, local_v2.y );

    }

}