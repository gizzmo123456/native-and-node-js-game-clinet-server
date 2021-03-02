

export class FakeRTCEventListener
{
    constructor()
    {
        this.bindedEvents = {};
    }

    addEventListener( eventName, callback )
    {
        this.bindedEvents[ eventName ] = callback;
    }

    /** trigger event form testing */
    triggerBindedMessage( key, socket)
    {
        if ( key in this.bindedEvents )
            this.bindedEvents[ key ](socket);
    }

}

export class FakeRTCDataChannel extends FakeRTCEventListener{

    constructor()
    {
        super();

        this.channel = this;

    }

}