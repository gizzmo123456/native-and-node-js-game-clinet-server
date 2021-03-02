import { Component } from '../../components/base/component.com.js'
import { Transform } from '../../components/transform.com.js';
import { UID } from '../../../componentManager.com.js';
import { BaseCollider } from '../../components/collider.com.js';

export class GameObject
{

    /**
     * How should the componets be constructed. This takes into account ComponentManager.ObjectActionMode.
     * 
     */
    static COMPONENT_INIT_MODES = {
        /** 
         * DEFAULT
         * The object have been created locally and fllows ComponentManager.ObjectActionMode default behaviour
         * ComponentManager.objectActionMode must be set to LOCAL or BOTH
         */
        LOCAL: "local",             
        /** 
         * The Object has or is being broadcasted over the network and fllows ComponentManager.ObjectActionMode default behaviour
         * ComponentManager.objectActionMode must be set to NETWORK or BOTH
         */
        NET_SYNC: "networkSync",    // 
        /**
         * Create the object locally, ignoreing the ComponentManager.ObjectActionMode. Also focues the object to not be synced over the network.
         */
        NO_SYNC: "noSync"
    }

    /**
     * Game Objects should NOT be constructed directly. Instead use ComponentManager.Create
     * @param {*} goid                  GameObject Unique ID
     * 
     */
    constructor ( goid )
    {

        this.objectID = goid;
        this.scene = null;          // the scene that this object is loaded into.
        this.initalized = false;
        this.initMode = null;

        
        this.transform = null;
        this.components = {}        // compName: component (constructed)

        // TODO: theres two should be combined, 
        //       i think this would help resove the mesh, collider, texture issue.
        this.meshes = [];
        this.sprites = [];  // << TODO. 

        // All componets constructors with a list of params
        // The constructors are removed from the list as they are constructed
        this.__constructors = {     // compName: [component, [params]]
            "transform": [ Transform, [] ], 
        };


    }

    /**
     * Initalizes the objects componets. (This should be not be called directly and is handeled by componetManager.Create)
     * (This can be called more than once to construct un-constructed componets at a latter time,
     * however, compoents can only be constructed once. If a constructed componet UID is supplied
     * it is simple ignored. unless in ALWAYS mode.)
     * @param {COMPONENT_INIT_MODES} initMode how should the components be initialized.
     * @param {*} uids Must be supplied if init mode is set to NET_SYNC otherwise uid's are ignored
     * 
     */
    InitComponents( initMode=GameObject.COMPONENT_INIT_MODES.LOCAL, uids={} )
    {

        var isNetworkCreated = initMode == GameObject.COMPONENT_INIT_MODES.NET_SYNC;
        var defaultBehaviour = initMode != GameObject.COMPONENT_INIT_MODES.NO_SYNC;

        this.initMode = initMode;

        // initalize all componets with unique ID's
        Object.keys( this.__constructors ).forEach( element => {
            let uid;

            if ( isNetworkCreated && element in uids )
            {
                uid = uids[ element ]
                delete uids[ element ]     // remove the element from the uids so any remaining can be checked for a uid update.
            }
            else if ( isNetworkCreated && this.__constructors[ element ][0].networkConstructorMode != Component.NETWORK_CONSTRUCTOR_MODES.ALWAYS )     
            {
                console.log( "Can not construct", element, this.__constructors[ element ][0].networkConstructorMode )
                // if isNetworkCreated, we must not construct 
                // any components who's uid is not supplied unless
                // it set to always construct.
                return; // Continue... 
            }     
            else
            {
                if ( isNetworkCreated )  // temp
                    console.warn( "element has been constructed with local ID when UIDs have been supplied", element, "(MODE: ",this.__constructors[element][0].networkConstructorMode, ")" );  // TEMP: to check that always construct works. (not error)

                uid = element+"::"+UID.Get();   // TODO: remove element. (its just hanndy for debuging :P)
            }

            // Construct the component into the componets obj and remove the constructor,
            // To prevent it from being constructed again.
            this.components[ element ] = new this.__constructors[ element ][0]( uid, this, defaultBehaviour, ... this.__constructors[ element ][1] );
            delete this.__constructors[ element ];

        } );

        // if there are any uids remaining we much check if a constructed componets uid can be updated.
        // See Componet.NETWORK_CONSTRUCTOR_MODES about updating UIDs affter construction
        Object.keys( uids ).forEach( element => {
            if ( element in this.components )   // attemp to update the uid
                this.components[ element ].UpdateUID( uids[ element ] );
        } );

        this.transform = this.components[ "transform" ];
        this.initalized = true;
        
    }

    /**
     * Gets the first instence of component type
     * @param {*} componentType type of componet
     * @returns componet of component type or Null if not found
     */
    GetComponent( componentType )
    {
        var componetsNames = Object.keys( this.components );

        for ( var i in componetsNames )
        {
            if ( this.components[ componetsNames[i] ] instanceof componentType )
                return this.components[ componetsNames[i] ];
        } 

        return null;
    }

    /**
     * Gets all instences of component type
     * @param {*} componentType type of componet
     * @returns Array of all componets of compont type 
     */
    GetComponents( compoentType )
    {

        var componetsNames = Object.keys( this.components );
        var componentsFound = []

        for ( var i in componetsNames )
        {
            if ( this.components[ componetsNames[i] ] instanceof componentType )
                componentsFound.push( this.components[ componetsNames[i] ] );
        } 

        return componentsFound;
    }

    /**
     * Get the instance of compoentName
     * Otherwise null
     */
    GetComponentOfName( componentName )
    {
        
        if ( componentName in this.components )
            return this.components[ componentName ];
        else
            return null;

    }

    Tick( time_delta_seconds ){ }

    /** Collider and Trigger events */

    /** (abstract) 
     * Called when another collider or trigger enters a collider on this object.
     * @param {BaseCollider} collider:      Collider on this object
     * @param {BaseCollider} otherCollider: Collider on the other object
     * @param {*}            triggerData:   
     */
    OnTrigger( collider, otherCollider, triggerData ){}

    /** (abstract) COLLISIONS ARE NOT IMPLERMENTED YET!
     * Called when another collider collides with a collider on this object.
     * @param {BaseCollider} collider:      Collider on this object
     * @param {BaseCollider} otherCollider: Collider on the other object
     * @param {*}            collisionData:  
     */
    OnCollision( collider, otherCollider, collisionData){}

}
