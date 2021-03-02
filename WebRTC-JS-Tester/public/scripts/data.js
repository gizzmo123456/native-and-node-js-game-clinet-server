
const { RTCPeerConnection, RTCSessionDescription } = window; 

const socket = io.connect("localhost:8222");

var peer = new RTCPeerConnection();
var dataChannle = peer.createDataChannel( "chat" );

var calling = [];
var activeCalls = []

peer.addEventListener("datachannel", event => {
    console.log( "Created Remote channel:: ")
    console.log( event.channel === dataChannle );
    const dc = event.channel;
    activeCalls.push(dc);

    dc.addEventListener("open", e => {
        console.log("Opened Remote channle")
    })

    dc.addEventListener("closed", e => {
        console.log("Closed Remote channle")
    })

    dc.addEventListener("message", e => {
        console.log("Received message from remote channle: "+ e.data )
        ReceivedMessage( e.data );

    })
});
/*
dataChannle.addEventListener("open", e => {
    console.log("Opened channle")
})

dataChannle.addEventListener("closed", e => {
    console.log("Closed channle")
})

dataChannle.addEventListener("message", e => {
    console.log("Received message from channle: "+ e.data )
    ReceivedMessage( e.data );

})
*/


document.getElementById("send").addEventListener("click", () =>{

    if ( dataChannle.readyState != 'open' )
    {
        console.log("Unable to send message not connected!");
        return;
    }

    var elem = document.getElementById("text");
    console.log(`Send message ${elem.value}`)
    dataChannle.send( elem.value );
    elem.value = "";
})



socket.on( "update-user-list", ({users}) => {
    console.log( users );

    users.forEach( socketID => {
        const button = document.createElement("button");
        button.setAttribute("id", socketID );
        button.innerHTML = `Inactive - ${socketID}` ;
        button.addEventListener("click", () => {
            CallUser( socketID );
        })
        document.getElementById("users").append( button );
    } )
    
} );

socket.on( "remove-user", ({socketId}) => {
    console.log( "bye bye", socketId );

    var elem = document.getElementById( socketId );

    if ( elem )
        elem.remove();


} );

socket.on( "call-made", async data => {
    console.log("Call MADE");

    await peer.setRemoteDescription(
        new RTCSessionDescription( data.offer )
    );
    const answer = await peer.createAnswer();
    await peer.setLocalDescription( new RTCSessionDescription(answer) );

    socket.emit( "make-answer", {
        answer,
        to: data.socket
    });

    

} );

socket.on( "answer-made", async data => {
    console.log("Answer");

    await peer.setRemoteDescription(
        new RTCSessionDescription( data.answer )
    );
} );





async function CallUser( socketID )
{
    var c = calling.find( c => c === socketID );

    if ( c )
    {
        console.log(`Already calling ${socketID}`);
        return;
    }

    console.log(`connect to ${socketID}`);

    calling.push(socketID);
    document.getElementById( socketID ).innerHTML = `Active - ${socketID}`;
    console.log("Call user");
    const offer = await peer.createOffer();
    await peer.setLocalDescription( new RTCSessionDescription(offer) );

    socket.emit( "call-user", {
        offer,
        to: socketID
    });

}

function ReceivedMessage( msg )
{
    document.getElementById("data").innerHTML += "<br />"+msg;
}