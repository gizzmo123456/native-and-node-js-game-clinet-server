import {DataPeer} from "./DataPeer.js";

const socket = io.connect("localhost:8222");
var clientID = "None";
var peers = [];
var receivedInitPeerList = false;

socket.on( "cid", (cid) => {
    clientID = cid;
    document.getElementById("clientID").innerHTML = clientID;
});

socket.on( "update-user-list", ({users}) => {
    console.log( users );

    users.forEach( socketID => {

        var peer = peers.find( peer => peer.clientID == socketID );

        if ( peer )
        {
            console.log( "Peer allready exist "+ socketID );
            return;
        }

        peer = new DataPeer( socketID, ReceivedMessage );
        peers.push( peer );

        if ( !receivedInitPeerList )
            peer.CallUser( socket );

        const p = document.createElement("p");
        p.setAttribute("id", socketID );
        p.innerHTML = `Inactive - ${socketID}` ;
        document.getElementById("users").append( p );
    } )

    receivedInitPeerList = true;
    
} );

socket.on( "remove-user", ({socketId}) => {
    console.log( "bye bye", socketId );

    var elem = document.getElementById( socketId );

    if ( elem )
        elem.remove();


} );

socket.on( "call-made", async data => {
    console.log("Call received");

    var peer = peers.find( peer => peer.clientID == data.socket );

    if ( !peer )
    {
        console.log( "Can not make call peer does not exist - "+ data.socket );
        return;
    }

    await peer.ReceiveCall( socket, data );

});

socket.on( "answer-made", async data => {
    console.log("received answer");

    var peer = peers.find( peer => peer.clientID == data.socket );

    if ( !peer )
    {
        console.log( "Can notanswer call peer does not exist - "+ data.socket );
        return;
    }

    await peer.AnsweredCall( data );

});

/* Chat */

document.getElementById("send").addEventListener("click", () =>{

    var elem = document.getElementById("text");
    console.log(`Sending message ${elem.value}`);

    if ( peers.length > 0)
    {
        for ( var peer in peers)
        {
            peers[peer].SendMessage( elem.value );
        }
    }

    ReceivedMessage( clientID +": "+ elem.value );
    elem.value = "";
})

function ReceivedMessage( msg )
{
    document.getElementById("data").innerHTML += "<br />"+msg;
}