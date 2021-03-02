import { ComponentManager } from '../componentManager.com.js'
import { Scene } from './base/scene.com.js';
import { Car } from '../objects/gameObjects/car.com.js';
import { Tank } from '../objects/gameObjects/tank.com.js';
import { TankTurret } from '../objects/gameObjects/tankTurret.com.js';

// Temp.
import {Missile} from '../objects/gameObjects/missile.com.js';


export class TestScene extends Scene
{
    constructor()
    {
        super();

        this.peerOwnedObjects = {} // key: clientID, value: object
    }

    get Background()
    {
        let bg = super.Background
        bg.color = "#555555"
        bg.image.src = "/includes/images/RaceCircet-1.png"
        bg.image.scale = {x: 1, y: 1}
        bg.image.position = {x: 0, y: 0}
        return bg;
    }

    get LocalSceneObjects()
    {
        return [[Missile, go => {
            go.transform.position.x = -10
        }]];
    }

    /** 
     *  Initalize the scene.
     *  Called affter LoadScene, but before the first tick 
     */
    Init(){}

    OnClientJoin( peerSocket )
    {
        var create = Car /*/Tank;//*/
        /*if ( Object.keys( this.peerOwnedObjects ).length % 2 )
            create = Car;
        //*/
        let go = this.Create( create );
        ComponentManager.__AssignGameObjectCompoentOwner( go, "inputs", peerSocket );
        this.peerOwnedObjects[ peerSocket.clientID ] = [go];

        if ( go )
        {
            go.transform.position = {x: 0, y: 0 }; // 4.7, y: -5};
            go.transform.rotation = 0;//280;
            go.transform.scale = {x: 1.5, y: 1.5}
        }

        if ( create == Tank && go)
        {
            let turret = this.Create( TankTurret );

            go.turret = turret;
            turret.body = go;

            this.peerOwnedObjects[ peerSocket.clientID ].push( turret );
            ComponentManager.GameObjectLinker( go, "turret", turret );
            //ComponentManager.GameObjectLinker( turret, "body", go );    // we must also link the tank body so its colliders can be ignore when firing missiles

        }

    }

    OnClientLeave( peerSocket )
    {

        this.peerOwnedObjects[ peerSocket.clientID ].forEach(element => {
            this.Destroy( element );
        });
        

        if ( peerSocket.clientID in this.peerOwnedObjects )
            delete this.peerOwnedObjects[ peerSocket.clientID ];
    }
}