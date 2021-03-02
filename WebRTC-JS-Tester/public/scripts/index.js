const conf = {
    iceServers: [
        {
        urls: "turn:localhost:8333",
        username: "giz",
        credential: "abs"
        }
    ]
}
const { RTCPeerConnection, RTCSessionDescription } = window; 
const peerConnection = new RTCPeerConnection(conf);
socket = io.connect("localhost:8222");

function UpdateUserList( socketIDs )
{
    const activeUsers = document.getElementById( "active-user-container" );

    socketIDs.forEach(sockID => {
        const exist = document.getElementById( sockID );
        if ( !exist )
        {
            activeUsers.appendChild( createUserItemContainer( sockID ) )
        }
    });
}

function createUserItemContainer(socketId) {
    const userContainerEl = document.createElement("div");
    
    const usernameEl = document.createElement("p");
    
    userContainerEl.setAttribute("class", "active-user");
    userContainerEl.setAttribute("id", socketId);
    usernameEl.setAttribute("class", "username");
    usernameEl.innerHTML = `Socket: ${socketId}`;
    
    userContainerEl.appendChild(usernameEl);
    
    userContainerEl.addEventListener("click", () => {
      //unselectUsersFromList();
      userContainerEl.setAttribute("class", "active-user active-user--selected");
      const talkingWithInfo = document.getElementById("talking-with-info");
      talkingWithInfo.innerHTML = `Talking with: "Socket: ${socketId}"`;
      CallUser(socketId);
    }); 
    
    return userContainerEl;
}

async function CallUser( socketID )
{
    console.log("Call user");
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription( new RTCSessionDescription(offer) );

    socket.emit( "call-user", {
        offer,
        to: socketID
    });

}


// Get audio and vedio devices and display on webpage
navigator.getUserMedia(
    {video: true, audio: true},
    stream => {
        const localVideo = document.getElementById("local-video");
        if ( localVideo )
            localVideo.srcObject = stream;

        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    },
    error => {
        console.warn( error.message );
    }
);

peerConnection.ontrack = function({ streams: [stream] }) {
    const remoteVideo = document.getElementById("remote-video");
    if (remoteVideo) {
      remoteVideo.srcObject = stream;
    }
   };

socket.on( "update-user-list", ({users}) => {
    UpdateUserList( users );
} );

socket.on( "remove-user", ({socketId}) => {
    console.log( socketId );
    var elemToRemove = document.getElementById( socketId );

    if ( elemToRemove )
        elemToRemove.remove();
    else
        console.log("Not Found!", elemToRemove);
} );

socket.on( "call-made", async data => {
    console.log("Call MADE");

    await peerConnection.setRemoteDescription(
        new RTCSessionDescription( data.offer )
    );
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription( new RTCSessionDescription(answer) );

    socket.emit( "make-answer", {
        answer,
        to: data.socket
    });

} );

socket.on( "answer-made", async data => {
    console.log("Answer");

    await peerConnection.setRemoteDescription(
        new RTCSessionDescription( data.answer )
    );
} );


/*
// set up signaling 
io_.on( "connection", socket => {
    const existingSocket = activeSockets.find( 
        existingSocket => existingSocket === socket.id
    );

    if ( !existingSocket )
    {
        this.activeSockets.push ( socket.id );

        socket.emit( "update-user-list", {
            users: this.activeSockets.filter(
                existingSocket => existingSocket !== socket.id
            )
        });

        socket.broadcast.emit( "update-user-list", {
            user: [socket.id]
        });
    }

} );
*/
