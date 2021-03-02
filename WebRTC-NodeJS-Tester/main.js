const isNodeJS = typeof process !== 'undefined' && process.release.name.search(/node|io.js/) != -1;
console.log( "is node JS: "+isNodeJS );

io = require("socket.io-client");
RTCPeerConnection = require("wrtc").RTCPeerConnection;
RTCDataChannel = require("wrtc").RTCDataChannel;
RTCSessionDescription = require("wrtc").RTCSessionDescription;

const sock = io.connect("http://localhost:8222");

const peer = new RTCPeerConnection();
var dataChannel = null;//peer.createDataChannel( "data" );

var toClientID = null
var calling = false;

/** Peer */
peer.addEventListener( "datachannel", event => {
    console.log( "Received remote data channle! " );

    dataChannel = event.channel;

    /** Bind onto channles events */
    dataChannel.addEventListener("open", e => console.log("Data channle open") );
    dataChannel.addEventListener("close", e => console.log("Data channle closed") );
    dataChannel.addEventListener("message", e => console.log( "Received message: "+e.data ) );
    
    dataChannel.send("Helloooo There im your server this everning");

} )

/** signalling status */
sock.on("connect", ()=>console.log("connected to signalling server"))
sock.on("disconnect", ()=>console.log("disconnected from signalling server"))

/** Signalling */
sock.on( "cid", (cid)=>console.log(`My Server CID is: ${cid}`) );
sock.on( "update-user-list", ({users})=>console.log(`new users ${users}`) );
sock.on( "remove-user", ({socketId})=>console.log(`users ${socketId} have left`) );

sock.on( "call-made", async (data)=>{
    console.log(`call recevied`);
    await ReceiveCall( data );
});

sock.on( "answer-made", async (data)=>{
    console.log(`Received Answer`);
    await AnsweredCall( data );
});

/** RTC call actions*/
async function CallUser()
{
    console.log( "Calling..." );

    calling = true;

    const offer = await peer.createOffer();
    await peer.setLocalDescription( new RTCSessionDescription( offer ) );

    sock.emit( "call-user", {
        offer,
        to: toClientID
    });

}

async function ReceiveCall( data )
{

    await peer.setRemoteDescription( new RTCSessionDescription( data.offer ) );
    const answer = await peer.createAnswer();
    await peer.setLocalDescription( new RTCSessionDescription( answer ) );

    toClientID = data.socket;

    sock.emit( "make-answer", {
        answer,
        to: data.socket
    });

    console.log( `answered!` );

    // TODO: Answer and respond to call.
    // ...
    if ( toClientID != null && !calling )
        CallUser();
}

async function AnsweredCall( data )
{
    console.log( `Called answered by ${data.socket}` )
    await peer.setRemoteDescription(
        new RTCSessionDescription( data.answer )
    );
}
