import { GameObject } from './base/gameObject.com.js';
import { Mesh } from '../components/mesh.com.js';
import { ComponentManager } from '../../componentManager.com.js';
import { Missile } from './missile.com.js';

export class TankTurret extends GameObject
{
    constructor( goid )
    {
        super( goid );

        this.body = null;

        // TODO: Combine these to meshes.
        this.meshes.push( new Mesh(     
            [
                {x: -0.35, y: -0.4 },
                {x:  0.35, y: -0.4 },
                {x:  0.35, y:  0.4 },
                {x:  0.075, y: 0.4 },
                {x:  0.075, y: 1.3 },
                {x: -0.075, y: 1.3 },
                {x: -0.075, y: 0.4 },
                {x: -0.35, y:  0.4 },
            ], 
            { fillColor: "#005500", borderWidth: 5 }
        ));

        this.meshes[0].drawAxis = true;
    }

    FireMissile()
    {
        if ( this.scene != null)
        {
            let missile = this.scene.Create( Missile, GameObject.COMPONENT_INIT_MODES.LOCAL );
            missile.transform.rotation = this.transform.rotation;
            let frw = this.transform.Forwards;

            missile.transform.position.x = this.transform.position.x + frw.x * 1.2;
            missile.transform.position.y = this.transform.position.y + frw.y * 1.2;
            missile.ignoreCollider = this.body.radCollider;
        }
    }
}