
// Fake Socket.IO to test that we bind on to the required message events
export class FakeIO
{
    constructor()
    {
        this.bindedMessageEvents = {};
    }

    on( eventName, callback )
    {
        this.bindedMessageEvents[ eventName ] = callback;
    }

    /** trigger event form testing */
    triggerBindedMessage( key, socket)
    {
        if ( key in this.bindedMessageEvents )
            this.bindedMessageEvents[ key ](socket);
    }

}

export class FakeSocket
{
    constructor()
    {
        this.id = ""
        this.bindedMessageEvents = {};
        this.emitedMessageEvents = {}
        this.broadcast = this;
    }

    // provided as part of io-client
    connect( address )
    {
        return this;
    }

    on( eventName, callback )
    {
        this.bindedMessageEvents[ eventName ] = callback;
    }

    to ( to )
    {
        return this;
    }

    emit( eventName, data )
    {
        this.emitedMessageEvents[eventName] = data;
    }

    /** trigger event form testing */
    triggerBindedMessage( key, data)
    {
        if ( key in this.bindedMessageEvents )
            this.bindedMessageEvents[ key ](data);
    }

    async triggerBindedMessageAsync( key, data )
    {
        if ( key in this.bindedMessageEvents )
            await this.bindedMessageEvents[ key ](data);
    }

}
