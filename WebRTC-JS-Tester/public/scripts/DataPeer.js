
export class DataPeer{

    STATUS = {
        CALLING: "calling",
        ACTIVE: "active",
        INACTIVE: "inactive"
    }

    constructor(clientID, receiveMessageCallback, channelName="data")
    {
        this.clientID = clientID;
        this.receiveMessageCallback = receiveMessageCallback;
        this.peer = new RTCPeerConnection();
        
        this.dataChannel = this.peer.createDataChannel( channelName, {
            ordered: false,
            maxRetransmits: 0,
            //maxPacketLifeTime: 0
        });

        this.remoteChannel = null;

        this.status = this.STATUS.INACTIVE;
        
        this.peer.addEventListener( "datachannel", event => {
            const dc = this.remoteChannel = event.channel;
            dc.addEventListener("open", e => this.ConnectionOpen(e) );
            dc.addEventListener("close", e => this.ConnectionClosed(e) );
            dc.addEventListener("message", e => this.ReceiveMessage(e) );
        } )
        this.peer.Ev
        this.dataChannel.addEventListener( "open", event => this.ConnectionOpen(event) );
        this.dataChannel.addEventListener( "close", event => this.ConnectionClosed(event) );
        this.dataChannel.addEventListener( "message", event => this.ReceiveMessage(event) );

    }

    /* Data Channle Events */
    ConnectionOpen( event )
    {
        console.log(`Opened channle to ${this.clientID}`)
    }

    ConnectionClosed( event )
    {
        console.log(`Closed channel to ${this.clientID}`)
    }

    ReceiveMessage( event )
    {
        this.receiveMessageCallback( this.clientID +": "+ event.data );
        console.log(`Recevied message from ${this.clientID}: ${event.data}`)
    }

    SendMessage( message )
    {

        if ( this.remotehannel && this.remoteChannel.readyState == 'open' )
            this.remotehannel.send( message );
        else if ( this.dataChannel && this.dataChannel.readyState == 'open' )
            this.dataChannel.send( message );

    }

    /* Connect, respond */
    async CallUser( socket )
    {

        if ( this.status != this.STATUS.INACTIVE )
        {
            console.log( `Already calling ${this.clientID}` );
            return;
        }

        console.log( `Calling ${this.clientID}` )

        this.status = this.STATUS.CALLING;

        const offer = await this.peer.createOffer();
        await this.peer.setLocalDescription( new RTCSessionDescription(offer) );
    
        socket.emit( "call-user", {
            offer,
            to: this.clientID
        });

    }

    async ReceiveCall( socket, data )
    {

        console.log( `Called received from ${this.clientID}` )

        await this.peer.setRemoteDescription(
            new RTCSessionDescription( data.offer )
        );
        const answer = await this.peer.createAnswer();
        await this.peer.setLocalDescription( new RTCSessionDescription(answer) );
    
        socket.emit( "make-answer", {
            answer,
            to: data.socket
        });

        if ( this.status == this.STATUS.INACTIVE)
            this.CallUser( socket );

    }

    async AnsweredCall( data )
    {
        console.log( `Called answered by ${this.clientID}` )
        await this.peer.setRemoteDescription(
            new RTCSessionDescription( data.answer )
        );

    }

}