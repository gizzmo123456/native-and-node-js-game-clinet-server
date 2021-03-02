import { NETWORK_ACTION, ComponentManager } from "../../../componentManager.com.js";

/**
 * The Base Componet
 * 
 * All compoents are designed to be networked at the Class level.
 * By default all classes have network functionality deisabled.
 * Call Component.SetNetworkAccess( MyComponent, canCollect, canApply )
 * to enable the relevent networking functionality.
 * 
 * ( 
 *   The reason to do the network like this is due to the client/server aspects
 *   for instance on the clients we only need to collect the data from the inputs
 *   and apply the transform data. While on the server we need to apply the inputs 
 *   and collect the trasform data. 
 *   Both can share the same code but handle the data differently 
 * )
 * 
 * Add any feilds that are not collected to MyComponent.__networkIgnoreFeilds. ie.
 * MyComponent.__networkIgnoreFeilds = [ ... ChildComponent.__networkIgnoreFeilds, "myFeild1", "myFeild2" ]
 * 
 * All Netowork components are regiestered into ComponentManager.networkComponents ('collect' or 'apply' respectivly)
 * 
 * Override Tick() to include update logic. (Which is ticked by its owner)
 * 
 */
export class Component
{

    static NETWORK_CONSTRUCTOR_MODES = {
        // NONE:     No one owns the component.
        DEFAULT: 'default',
        // ASSIGNED: The component must be emited from all clients that do not own the object
        //           In other words, the component ID should only be sent to the owner.
        //           (When network create is called, only components with an assigned ID
        //           are constructed. See GameObject.InitComponent for futher info. ) 
        ASSIGNED: 'assigned',
        // ALLWAYS: The component is constructed regardless of receiving a uid,
        //          If a UID is received at a later time, it is updated.
        ALWAYS: 'always'

        // Just to be 100% clear. the modes above DO NOT affect local construction.
        // But rather 'assigned' prevents the components being contructed remotly.              
        // Also, neither affect the functionality of NetworkCollect and NetworkApply.
        // However this may change at a later data. (but is not nessary for this project)
        // (i feel that 'assigned' should only collect and send the data to it owner and
        // it should also only apply the data if received from the owner. (or maybe that 
        // should be another mode?))

        // TODO: Add more modes. (this is all that is required for this project)
    }

    static canNetworkCollect  = false;
    static canNetworkApply    = false;

    static networkConstructorMode = Component.NETWORK_CONSTRUCTOR_MODES.DEFAULT;

    static __networkFeilds = null;
    static __networkIgnoreFeilds = [ "uid",             // The uid is added to the data structur at the component manager.
                                     "componentOwner", 
                                     "networkOwner" 
                                    ]    

    /**
     * 
     * @param {Component Type} componentType 
     * @param {bool} canCollect 
     * @param {bool} canApply 
     */
    static SetNetworkAccess( componentType, canCollect, canApply )
    {
        // Example usage
        // Component.SetNetworkCollect( MyComponent, false, true );
        
        componentType.canNetworkCollect = canCollect;
        componentType.canNetworkApply   = canApply;

    }

    /**
     * @param {Component Type} componentType
     * @param {Component.NETWORK_CONSTRUCTOR_MODES} netOwnerMode 
     */
    static SetNetworkConstructorMode( componentType, netConstructMode )
    {
        // Example usage
        // Component.SetNetworkConstructorMode( MyComponent, Component.NETWORK_CONSTRUCTOR_MODE.ASSIGNED )
        componentType.networkConstructorMode = netConstructMode;
    }

    /**
     * 
     * @param {*} uid Unique component ID.
     * @param {GameObject} componentOwner The game object that owns the component 
     */
    constructor ( uid, componentOwner, net_sync )
    {
        this.uid = uid;
        this.componentOwner = componentOwner;
        this.networkOwner = null;               // should be peerSocket?

        //this._RegisterNetworkFeilds();
        if ( net_sync )
            this._RegisterNetworkComponent();

    }

    /**
     * Updates the uid if the constructor mode permits it.
     * @param {*} newUID  the new UID to assigne to the object
     */
    UpdateUID( newUID )
    {
        if ( this.constructor.netOwnerMode != Component.NETWORK_CONSTRUCTOR_MODES.ALLWAYS )
            return 

        console.log( this.constructor.name, "UID Updated from:", this.uid, "to:", newUID )

        // Update the uids in the componet manager 
        if ( this.constructor.canNetworkCollect )
            ComponentManager.UpdateNetworkID(NETWORK_ACTION.COLLECT, this.uid, newUID)
        if ( this.constructor.canNetworkApply )
            ComponentManager.UpdateNetworkID(NETWORK_ACTION.APPLY, this.uid, newUID)

        this.uid = newUID

    }

    Tick( time_delta ){}

    _RegisterNetworkFeilds()
    {
        // We only need to get the network feilds the first time the objects is constructed.
        // since there are stored staticly.
        // this.constructor alow use to access the correct static var that belogs to the child classes!
        if ( this.constructor.__networkFeilds != null || ( !this.constructor.canNetworkCollect && !this.constructor.canNetworkApply ) )
        {
            if ( this.constructor.__networkFeilds == null )
                this.constructor.__networkFeilds = [];
            return;
        }

        this.constructor.__networkFeilds = Object.keys( this );

        // remove the uid and ownerID
        this.constructor.__networkFeilds = this.constructor.__networkFeilds.filter( item => !this.constructor.__networkIgnoreFeilds.includes( item ) );
        
    }

    _RegisterNetworkComponent()
    {
        
        if ( this.constructor.canNetworkCollect )
            ComponentManager.RegisterNetworkComponet( NETWORK_ACTION.COLLECT, 
                                                      this.uid, 
                                                      this.componentOwner.objectID, 
                                                      this._OnNetworkCollect.bind(this) );

        if ( this.constructor.canNetworkApply )
            ComponentManager.RegisterNetworkComponet( NETWORK_ACTION.APPLY, 
                                                      this.uid,
                                                      this.componentOwner.objectID,
                                                      this._OnNetworkApply.bind(this) );

    }

    /**
     * Collects all collectable feilds.
     */
    _OnNetworkCollect()
    {
        // Get and catch the network feilds.
        // idealy i would perfer to have this in the constructor however,
        // 'this' is refering to Component rather than inherited class.
        if ( this.constructor.__networkFeilds == null )
            this._RegisterNetworkFeilds();
        
        if ( !this.constructor.canNetworkCollect || this.constructor.__networkFeilds.length == 0 )
            return null;

        // TODO: it would proberly be better if we only collected changed data.
        // But this will do for now.

        var data = { }

        this.constructor.__networkFeilds.forEach(element => {
            let value = this[element];
            if ( !isNaN( value ) && !Number.isInteger(value) )
                data[ element ] = parseFloat(Number(value).toFixed(3));
            else if ( typeof value === 'object' )
                data[element] = this.__ReduceSubFloatValues( value );
            else
                data[ element ] = this[ element ];
        });

        return data;
    }

    __ReduceSubFloatValues( object )
    {
        // this will do for now, to a depth of one. but
        // TODO: I feel that we should find all float feilds in
        //       the _RegisterNetworkFeilds method and re-build the 
        //       structuer with on the fly methods
        //       so we can perform magic on values like floats.
        //       I should write so notes about this in depth.
        var reducedObject = {}
        Object.keys( object ).forEach( key => {
            let value = object[key];
            if ( !isNaN( value ) && !Number.isInteger(value) )
                reducedObject[ key ] = parseFloat(Number(value).toFixed(3));
            else
                reducedObject[ key ] = object[ key ];
        } )

        return reducedObject;

    }

    _OnNetworkApply( data={} )
    {

        //console.log("Applying:", this.uid, data)

        // Get an catch the network feilds.
        // idealy i would perfer to have this in the constructor however,
        // 'this' is refering to Component rather than inherited class.
        if ( this.constructor.__networkFeilds == null )
            this._RegisterNetworkFeilds();

        if ( !this.constructor.canNetworkApply || this.constructor.__networkFeilds.length == 0 )
            return null;

        Object.keys(data).forEach( element => {
            if ( !this.constructor.__networkIgnoreFeilds.includes( element ) )
                this[ element ] = data[element];
        } );

    }

}