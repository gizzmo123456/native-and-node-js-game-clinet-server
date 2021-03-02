
import { Component  } from "./objects/components/base/component.com.js";
import { GameObject } from "./objects/gameObjects/base/gameObject.com.js"
import { Constructors, Objects    } from "./constructors.com.js";

export const NETWORK_ACTION = {
    COLLECT: ["collect"],
    APPLY:   ["apply"],
    BOTH:    ["collect", "apply"]
}

/** 
 * Unique ID generator
 */
export class UID
{

    static __uid = -1;
    static uid_prefix = "l";    // l for local.
    static Get(postfix="")
    {
        UID.__uid++;

        return `${UID.uid_prefix}-${++UID.__uid}-${postfix}`;

    }

}

/** 
 *  Manages all GameObjects and Networked GameObject Components,
 *  
 *  Collects and applies network data for components that are network enabled.
 */
export class ComponentManager
{

    static OBJECT_ACTION_MODE = {
        LOCAL: 'local',             // alows objects to be created/destroyed locally only (ie. single player)
        NETWORK: 'network',         // alows objects to be created/destroyed via the network only (ie. multiplayer client)
        BOTH: 'local/network'       // alows objects to be created/destroy both locally and remotly via the network (ie. multiplayer server)
    }

    static objectActionMode = ComponentManager.OBJECT_ACTION_MODE.LOCAL;
    
    /**
     * Sets the aproprate create/destroy methods. Ie.
     * Create/destroy locally, remotly or both 
     * @param {OBJECT_ACTION_MODE} objActionMode 
     */
    static SetObjectActionMode( objActionMode )
    {
        ComponentManager.objectActionMode = objActionMode;
    }

    static allObjects = {}  // Dict. key: goID, value: GO.

    /** key: uid
     * value: compnents onNetworkCollect or onNetworkApply method. 
     */
    static networkComponents = {          // objects that are tracked by the server.
        objectIDs: [],                    // List of all game object IDs containg networked components
        collect: {},
        apply: {}
    }     

    static __networkQueue = {
        created: [],
        destroyed: [],
        linker: []
    }

    // Crete and destroy method UIDs must be fixed between all clients.
    // Since we can not garentee the they will all be assigned the same.
    static createUID  = "CM-C!";
    static destroyUID = "CM-D!";
    static linkerUID  = "CM-L!";

    static Init()
    {

        if ( ComponentManager.objectActionMode == ComponentManager.OBJECT_ACTION_MODE.NETWORK ||
             ComponentManager.objectActionMode == ComponentManager.OBJECT_ACTION_MODE.BOTH      )
        {
            ComponentManager.RegisterNetworkComponet( NETWORK_ACTION.APPLY,   ComponentManager.createUID,  "CM", ComponentManager.__OnNetworkCreate.Apply );
            ComponentManager.RegisterNetworkComponet( NETWORK_ACTION.APPLY,   ComponentManager.destroyUID, "CM", ComponentManager.__OnNetworkDestroy.Apply );
            ComponentManager.RegisterNetworkComponet( NETWORK_ACTION.APPLY,   ComponentManager.linkerUID,  "CM", ComponentManager.__OnNetworkLinker.Apply );
        }

        if ( ComponentManager.objectActionMode == ComponentManager.OBJECT_ACTION_MODE.BOTH )
        {
            ComponentManager.RegisterNetworkComponet( NETWORK_ACTION.COLLECT, ComponentManager.createUID,  "CM", ComponentManager.__OnNetworkCreate.Collect );
            ComponentManager.RegisterNetworkComponet( NETWORK_ACTION.COLLECT, ComponentManager.destroyUID, "CM", ComponentManager.__OnNetworkDestroy.Collect );
            ComponentManager.RegisterNetworkComponet( NETWORK_ACTION.COLLECT, ComponentManager.linkerUID,  "CM", ComponentManager.__OnNetworkLinker.Collect );
        }

    }

    /**
     * 
     * @param {NETWORK_ACTION} netAction    list of network actions. use const NETWORK_ACTION
     * @param {*} uid                       the components unique id
     * @param {*} callback                  the componets onNetworkCollect or onNetworkApply method
     */
    static RegisterNetworkComponet( netAction, uid, owner_uid, callback )
    {

        netAction.forEach( element => {
            if ( uid in ComponentManager.networkComponents[ element ] )
            {
                console.warn( `Unable to register componet ${uid}. Allready registered. Use UpdateNetowkrID insted` );
            }
            else
            {
                
                if ( !ComponentManager.networkComponents.objectIDs.includes( owner_uid ) )
                    ComponentManager.networkComponents.objectIDs.push( owner_uid );

                ComponentManager.networkComponents[ element ][uid] = callback;
            }
        } );

    }

    static UpdateNetworkID( netAction, oldUID, newUID )
    {

        if ( oldUID == newUID )
        {
            // TODO: find out why this is happening to begin with.
            // BUG:  When multiply clients are waiting for the game server to connect
            //       The re-assign ID is being sent to clients that dont need the ID re-assigning.
            console.error("Unable to update UID. Old and new UID are the match");
            return;
        }

        netAction.forEach( element => {
            
            if ( (oldUID in ComponentManager.networkComponents[element]) )
            {
                ComponentManager.networkComponents[element][ newUID ] = ComponentManager.networkComponents[element][ oldUID ];
                delete ComponentManager.networkComponents[element][ oldUID ];
            }
            else
            {
                console.error( "Unable to update NetworkID (from:", oldUID, "to:", newUID, ") does not exist in", element );
            }

        } );

    }

    /**
     * Creates a gameObject, and collects the relevent network data if required to do so.
     * If creating an object associated with a scene use the Create method in the scene instance.
     * (Also note. Only the client who creates the object need to known the associated scene
     *  and therefor no scene data is synced)
     * @param {*} GameObjectType: GameObject type to create.
     * 
     */
    static Create( GameObjectType, componentInitMode=GameObject.COMPONENT_INIT_MODES.LOCAL )
    {

        var canSync = componentInitMode != GameObject.COMPONENT_INIT_MODES.NO_SYNC

        if ( canSync && ComponentManager.objectActionMode == ComponentManager.OBJECT_ACTION_MODE.NETWORK )
        {
            console.warn( "Unable to create sync object locally" );
            return;
        }

        var gameObj = ComponentManager.__Create( GameObjectType, UID.Get("go"), {}, componentInitMode );
        
        // queue the object to be created on the network.
        if ( canSync && gameObj != null && ComponentManager.objectActionMode == ComponentManager.OBJECT_ACTION_MODE.BOTH )
        {
            /** Format
             *  {
             *      type: name,     // GameObject type
             *      uid:  uid,      // GameObject UID
             *      cuid: {}        // GameObject Component UIDs ( key: component name, value: uid )
             *  }
             */

            var networkData = ComponentManager.__GetGameObjectData( gameObj )

            // queue to be sent over the network.
            ComponentManager.__networkQueue.created.push( networkData );

        }

        return gameObj;

    }

    static __OnNetworkCreate = {
        Collect: function( ){
            // get and clear the created network queue.
            var data = ComponentManager.__networkQueue.created;
            ComponentManager.__networkQueue.created = [];
            return data;

        },
        Apply  : function( data=[] ){
            
            data.forEach( element => {
                ComponentManager.__Create( Objects.constructors[element.type], element.uid, element.cuid, GameObject.COMPONENT_INIT_MODES.NET_SYNC )
            })

        }
    }

    /** 
     * Internal Create GameObject. (use 'Create()' instead) 
     * @param {*} GameObjectType 
     * @param {*} guid 
     * @param {*} cuids 
     */
    static __Create( GameObjectType, guid, cuids, componentInitMode )
    {
        if ( guid in ComponentManager.allObjects )
        {
            console.log("Assigning CUIDs (", guid,")");
            // Attempt to apply the cuids if the GO already exist.
            ComponentManager.allObjects[ guid ].InitComponents( componentInitMode, cuids );

            return ComponentManager.allObjects[ guid ];
        }
        else
        {
            if ( !GameObjectType )
            {
                console.error( "Unable to create object. No Constructor supplied. If created over the network make sure the object has be added to 'Objects' in constructors.com.js" );
                return;
            }
            let gameObj = new GameObjectType( guid );
            gameObj.InitComponents( componentInitMode, cuids );

            ComponentManager.allObjects[ guid ] = gameObj;

            return gameObj;
        }

    }

    /**
     * Get the Inital gameObjects constructor and componet uids available to all clients.
     * Any componets with ownership mode 'ASSIGNED' are removed.
     * Call __AssignGameObjectCompoentOwner( go, compName, peerSocket )     [TODO]
     * Affter GameGameObjectData to assign the componet to a client (or peerSocket). 
     * 
     * @param {*} gameObj a game object
     */
    static __GetGameObjectData( gameObj )
    {
    
        if ( !gameObj )
        {
            console.log( "Unable to get game object data. No object supplied!" );
            return;
        }

        const networkData = {
            type:   gameObj.constructor.name,
            uid:    gameObj.objectID,
            cuid:   {}
        }

        // get all the component IDs
        Object.keys( gameObj.components ).forEach( key => {
            if ( gameObj.components[ key ].constructor.networkConstructorMode != Component.NETWORK_CONSTRUCTOR_MODES.ASSIGNED )
                networkData.cuid[ key ] = gameObj.components[ key ].uid
        })

        return networkData;

    }

    /**
     * Assigns the ownerSocket as the owner of a component with ownership mode 'ASSIGNED'
     * And send a message to the client to construct the compoent.
     * (If the compoent is already owned, the request will be rejected)
     * 
     * @param {*} gameObject         GameObject that owns the componet
     * @param {*} componentName      Name of the compoent, to set the owner of
     * @param {*} ownerSocket        The Peer socket of the owner.
     */
    static __AssignGameObjectCompoentOwner( gameObject, componentName, ownerSocket )
    {

        if ( !gameObject )
        {
            console.log( "Unable to get game object data containing the component" );
            return;
        }

        var comp = gameObject.GetComponentOfName( componentName );

        if ( !comp )
        {
            console.log( "Unable to assign owner. Component not found." );
            return;
        }
        else if ( comp.constructor.networkConstructorMode != Component.NETWORK_CONSTRUCTOR_MODES.ASSIGNED )
        {
            console.log( "Unable to assign an owner to a compoent with ownership mode set to 'DEFAULT' or 'ALWAYS' " );
            return;
        }
        else if ( comp.networkOwner != null )
        {
            console.log( "Unable to assign owner. Already assigned!" );
            return;
        }

        // Set the owner and gather the required data.
        comp.networkOwner = ownerSocket

        const networkData = {
            type:   gameObject.constructor.name,
            uid:    gameObject.objectID,
            cuid:   {}
        }     
        
        networkData.cuid[ componentName ] = comp.uid;

        // For not at least, we'll just send the message directly to the client.
        // But it might be better to make sure it happens affter the original 
        // constructor is sent. 
        // TODO: This needs queuing ^^^^^^^ ASAP 
        // as it sometimes attemps to render the componet requireing the transform.
        // it might be worth just adding another owner mode to always construct regardless
        var data = {};
        data[ ComponentManager.createUID ] = [networkData];

        let packet = new Constructors.dataPacket()
            packet.Payload = data;

        ownerSocket.SendMessage( packet.CreateBuffer() );
        //console.log( "Send", packet.CreateBuffer() );
        
    }

    /**
     * Destroys the game object.
     * If destroying an object associated with a scene use the Destroy method in the scene instance.
     * 
     * @param {*} gameObject: gameObject to destroy
     */
    static Destroy( gameObject )
    {

        let canSync = false;

        if ( !gameObject )
        {
            console.log( "Can not destroy game object. No object supplied" )
            return;
        }
        else
        {
            canSync = gameObject.initMode != GameObject.COMPONENT_INIT_MODES.NO_SYNC;
        }
        
        if ( canSync && ComponentManager.objectActionMode == ComponentManager.OBJECT_ACTION_MODE.NETWORK )
        {
            console.warn( "Unable to remove object locally" );
            return;
        }

        ComponentManager.__Destroy( gameObject )        

        if ( canSync && ComponentManager.objectActionMode == ComponentManager.OBJECT_ACTION_MODE.BOTH )
        {
            ComponentManager.__networkQueue.destroyed.push( gameObject.objectID );
        }

    }

    static __OnNetworkDestroy = {
        Collect: function( ){

            var data = ComponentManager.__networkQueue.destroyed;
            ComponentManager.__networkQueue.destroyed = [];
            return data;

        },
        Apply: function( data=[] ){

            data.forEach( element => {
                if ( element in ComponentManager.allObjects )
                    ComponentManager.__Destroy( ComponentManager.allObjects[ element ] );
            });

        }
    }

    static __Destroy( gameObject )
    {
        if ( gameObject.objectID in ComponentManager.allObjects )
        {
            delete ComponentManager.allObjects[ gameObject.objectID ];
            
            var netObjID = ComponentManager.networkComponents.objectIDs.findIndex( (id) => id == gameObject.objectID )

            if ( netObjID > -1 )
            {

                // remove all components from the network sync
                Object.keys( gameObject.components ).forEach( element => {

                    var uid = gameObject.components[ element ].uid;
                    if ( uid in ComponentManager.networkComponents.collect )
                        delete ComponentManager.networkComponents.collect[ uid ];

                    if ( uid in ComponentManager.networkComponents.apply )
                        delete ComponentManager.networkComponents.apply[ uid ];
                        
                });

                ComponentManager.networkComponents.objectIDs.splice( netObjID, 1 );

            }
        }
    }

    /**
     * Sets a gameObject ref into another gameobjects variable on a remove client
     * This is only available for clients with ComponentManager.objectActionMode set to ComponentManager.OBJECT_ACTION_MODE.BOTH
     * Since its for linking network object remotely.
     */
    static GameObjectLinker( gameObjectToUpdate, variableName, gameObjectToSet )
    {
        if ( ComponentManager.objectActionMode != ComponentManager.OBJECT_ACTION_MODE.BOTH )
        {
            console.log( "Unable to link object" );
            return;
        }

        // get the values that can be used on the network
        let goToUpdateID = gameObjectToUpdate.objectID;
        let goToSetID    = gameObjectToSet.objectID;

        let linkData = {
            gtu: goToUpdateID,
            vn: variableName,
            gts: goToSetID
        }

        ComponentManager.__networkQueue.linker.push( linkData )

    }

    static __OnNetworkLinker = {
        Collect: function()
        {
            var data = ComponentManager.__networkQueue.linker;
            ComponentManager.__networkQueue.linker = [];
            return data;
        },
        Apply: function( data=[] )
        {
            data.forEach( element => {
                if ( element.gtu in ComponentManager.allObjects && element.gts in ComponentManager.allObjects )
                    ComponentManager.allObjects[ element.gtu ][ element.vn ] = ComponentManager.allObjects[ element.gts ];
                else
                    console.warn("Unable to link GameObjects. One or both do not exist");
            });
        }
    }

    /**
     * Collects the data to be broadcasted over the network.
     * @returns the packet to sent
     */
    static NetworkCollect()
    {

        /** Data structure
         *  uid: {
         *    feild_0: value,
         *    feild_1: {
         *      subFeild_1: value,
         *      subFeild_0: value
         *      }
         *  }
         */

        var data = {};

        Object.keys( ComponentManager.networkComponents.collect ).forEach( element => {
            data[ element ] = ComponentManager.networkComponents.collect[ element ]();
        });

        if ( Object.keys( data ).length == 0 )
            return null;
        
        //console.log( "Collected:", packet );

        return data;    // return the payload

    }
    
    /**
     * 
     * @param {BasePacket} packet 
     */
    static NetworkApply( packet )
    {
        //console.log( "Received:", packet );
        var data = packet.Payload;

        Object.keys( data ).forEach( element => {
            if ( element in ComponentManager.networkComponents.apply )
                ComponentManager.networkComponents.apply[ element ]( data[ element ] );
        });

    }

    /**
     * Called once when a peer connects.
     * @param {*} peerSocket peer to send the message to
     * @param {*} message       
     */
    static OnNetworkConnectionOpen( peerSocket, message )
    {
        if ( ComponentManager.objectActionMode == ComponentManager.OBJECT_ACTION_MODE.BOTH )
        {
            
            // Send all synced objects, to the newly connected client.
            var syncObjects  = [];

            ComponentManager.networkComponents.objectIDs.forEach( element => {

                // prevent any objects queued to be created over the network
                // being included in the initial payload, as it will be sent 
                // in the net update message.
                // TODO: This will do for now, however it would be better if
                //       objects that are pending to be created over the network
                //       where not added to AllObjects until the create message is 
                //       sent. This would insure that the data is not included in the
                //       initial payload.
                var pending = false;
                for ( var i in this.__networkQueue.created )
                    if ( element == this.__networkQueue.created[i].uid )
                    {
                        pending = true;
                        break;
                    }

                if ( pending ) return;  // continue...

                let gameObj = ComponentManager.allObjects[ element ];
                console.log( element, ComponentManager.networkComponents.objectIDs );

                let data = ComponentManager.__GetGameObjectData( gameObj );

                if ( data != null )
                    syncObjects.push( data );

            } );

            var data = {};
            data[ ComponentManager.createUID ] = syncObjects;
            
            let packet = new Constructors.dataPacket()
            packet.Payload = data;

            peerSocket.SendMessage( packet.CreateBuffer() );

            console.log( "ONCO:", packet );

        }

    }

}