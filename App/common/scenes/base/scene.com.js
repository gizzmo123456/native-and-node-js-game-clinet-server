import {ComponentManager} from "../../componentManager.com.js"
import {GameObject}       from "../../objects/gameObjects/base/gameObject.com.js"

export class Scene
{

    constructor() 
    {

        this.__loaded = false;
        this.sceneObjects = {}; // Key: uid, value: GameObject
    }

    /** Virtual methods */

    get Background()
    {
        return {
            color: "#ffffff",                                   // The background colour of the scene
            image: {                                            // the background image to use
                src: "https://placekitten.com/1400/1000",       // the url of the image.
                position: {x: 0, y: 0},                         // the world position in units the background image should be positioned
                scale: {x: 2, y: 2}                             // the scale of the background image
            }
        }
    }

    /** 
     * (Requires override)
     * The Initial Game Objects to be loaded locally into the scene.
     * (All GameObjects are loaded in with the NO_SYNC flag enabled)
     * Use Init function to manully create objects that require net syncing. 
     * @returns {Array} Arrays of Arrays. [[Constructor, serialized callback], ...]
     * Example.
     * return [
     *      [GameObject, go => {
     *          go.transform.position = {...}
     *      }],
     *      ...    
     *   ]
     * 
     * or without serialized data.
     * return [[ GameObject ], ...]
     */
    get LocalSceneObjects()
    {
        return [];
    }

    /** 
     *  Initalize the scene.
     *  Called affter LoadScene, but before the first tick (TODO)
     */
    Init(){}

    OnClientJoin( peerSocket ){}
    OnClientLeave( peerSocket ){}

    /** Scene Methods */

    /** 
     * Loads the local scene objects.
     * (This should only be called by the game manager and there should be no reasion to override the method.)
     */
    LoadScene()
    {

        if ( this.__loaded )
        {
            console.error( "Unable to load scene, already loaded " )
            return;
        }

        this.LocalSceneObjects.forEach( element => {

            let _constructor = element[0];
            let _serializedCallback    = element[1];
            
            let obj = this.Create( _constructor, GameObject.COMPONENT_INIT_MODES.NO_SYNC );
            _serializedCallback( obj );

        } );

        this.__loaded = true;
    }

    /**
     * Unloads all Scene Objects
     */
    UnloadScene()
    {

        if ( !this.__loaded )
        {
            console.warn( "Unable to unload scene. Not loaded" );
            return;
        }

        // Destroy all objects loaded into the scene.
        Object.keys( this.sceneObjects ).forEach( key => {
            this.Destroy( this.sceneObjects[ key ] );
        });

        this.__loaded = false;

    }

    /** Mirrored methods from componentManager with additional scene functionality */

    /**
     * Creates a gameObject, and collects the relevent network data if required to do so.
     * @param {*} GameObjectType      GameObject type to create.
     */
    Create( GameObjectType, componentInitMode=GameObject.COMPONENT_INIT_MODES.LOCAL )
    {
        // Create the object and add it to the scenes list of objects
        var obj = ComponentManager.Create( GameObjectType, componentInitMode )
        
        if ( !obj )
            return null;

        obj.scene = this;
        this.sceneObjects[ obj.objectID ] = obj;

        return obj;

    }

    /**
     * Destroys the game object.
     * 
     * @param {*} gameObject gameObject to destroy
     */
    Destroy( gameObject )
    {

        if ( !gameObject )
        {
            console.log( "Can not destroy game object. No object supplied" )
            return;
        }

        ComponentManager.Destroy( gameObject );

        delete this.sceneObjects[ gameObject.objectID ];

    }

} 