
// Servers public and common directories along with RTC signalling 

import express from "express";
import { Server as io } from "socket.io";
import {createServer} from "http"; 
import path from "path";

const DIR_PATH = path.resolve();

// Set up the web and signaling
export class Server
{
    constructor( serverKey=null, address="localhost", port=8333 )
    {

        this.app = express();
        this.httpServer = createServer( this.app );
        this.io = new io( this.httpServer );
        this.serverKey = serverKey;

        this.serverSocket = null;
        this.serverSocketType = null;
        
        this.address = address
        this.port = port

    }

    Init()
    {

        console.log( DIR_PATH );
        // Set public and common directories
        this.app.use(express.static(  DIR_PATH + "/public" ));
        this.app.use('/common', express.static( DIR_PATH + "/common" ));

        // bind the test direct if we running on local host.
        if ( this.address == `localhost` )
        {
            this.app.use('/test', express.static( DIR_PATH + "/private/Test/Client/Javascript" ));
            this.app.use('/testDoubles', express.static( DIR_PATH + "/private/Test/testDoubles" ));
        }

        // Accept new IO connections and add signaling events
        this.io.on( "connection", socket => {
            
            console.log( "New Socket Connection" );

            // TODO: remember user
            socket.emit( "cid", socket.id ); // give the client there id.

            if ( this.serverSocket != null )
            {
                socket.emit( "server-available", this.ServerInfo );
            }

            socket.on( "set-server", data => {

                if ( socket.id + this.serverKey == data.key )
                {
                    socket.emit( "server-set", data );

                    if ( this.serverSocket == null )
                    {
                        this.serverSocket = socket;
                        this.serverSocketType = data.type;
                        socket.broadcast.emit( "server-available", this.ServerInfo )
                        console.log("Server Set!");
                    }
                    else
                    {
                        console.log("Unable to set server, already set.");
                    }
                    
                }

            });           

            // offer con -> con offer made -> anw con -> con anw made
            socket.on( "offer-connection", data => {

                if ( this.serverSocket == null ) return;

                console.log( "Offer" );
                socket.to( data.to ).emit("connection-offer-made", {
                    from: socket.id,
                    offer: data.offer
                });
            });

            socket.on( "anwser-connection", data => { 

                if ( this.serverSocket == null ) return;

                console.log( "Answer: To:", data.to );
                socket.to( data.to ).emit( "connection-anwser-made", {
                    from: socket.id,
                    answer: data.answer
                })
            });

            socket.on( "disconnect", () => {
                
                if ( this.serverSocket != null && socket.id == this.serverSocket.id )
                {
                    socket.broadcast.emit( "server-disconnect", socket.id );
                    this.serverSocket = null;
                    this.serverSocketType = null;
                    console.log( `Server disconnected! ${socket.id}` )
                }
                else
                {
                    console.log( `Client Dissconnected! ${socket.id}` )
                }

            })

        });
    }

    get ServerInfo()
    {
        return {
            sid: this.serverSocket.id,
            type: this.serverSocketType
        };

    }

    Listen()
    {
        // listen for network events
        this.httpServer.listen( { port: this.port, host: this.address }, () => console.log(`Server is listening on ${this.address}:${this.port}`) );
    }

    Close()
    {
        console.log("closing http and signalling...");
        this.httpServer.close();
        this.io.close();
        console.log("http and signalling closed");
    }

}
