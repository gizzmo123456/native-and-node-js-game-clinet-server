import { ComponentManager } from '../componentManager.com.js'
import { Scene } from './base/scene.com.js';
import { Car } from '../objects/gameObjects/car.com.js';

export class BaseTrack extends Scene
{
    constructor()
    {
        super();

        this.peerOwnedObjects = {} // key: clientID, value: object
    }

    get LocalSceneObjects()
    {
        return [];
    }

    /** 
     *  Initalize the scene.
     *  Called affter LoadScene, but before the first tick 
     */
    Init(){}

    OnClientJoin( peerSocket )
    {

        let go = this.Create( Car );
        ComponentManager.__AssignGameObjectCompoentOwner( go, "inputs", peerSocket );

        if ( go )
        {
            this.peerOwnedObjects[ peerSocket.clientID ] = [go];
            go.transform.position = {x: 0, y: 0 };
            go.transform.rotation = 0;
            go.transform.scale = {x: 1.5, y: 1.5}
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