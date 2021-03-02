import { GameObject } from './base/gameObject.com.js';
import { Mesh } from '../components/mesh.com.js';

/**
 * This is an empty class for game objects :P
 */
export class EmptyGameObject extends GameObject {

    constructor( goid )
    {
        super( goid );

        // a square :P
        this.meshes.push( new Mesh(     
            [
                {x: -0.5, y: -0.5 },
                {x:  0.5, y: -0.5 },
                {x:  0.5, y:  0.5 },
                {x: -0.5, y:  0.5 },
            ], 
            { fillColor: '#888888' },
            null
        ));

    }

    Tick( time_delta_seconds )
    {

    }

    OnTrigger()
    {
        
    }

}