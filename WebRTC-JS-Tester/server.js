//import express, {Application} from "express";
//import socketIO, { Server as SocketIOServer } from "socket.io";
//import { createServer, Server as HTTPServer } from "http";

const { Console } = require("console");

express = require("express");
io = require("socket.io");
http = require("http");

class Server{
    
    PORT = 8222;
    activeSockets = [];

    constructor()
    {
        this.init();
        //this.handleRoutes();
        this.handleSocketConnection();

    }

    init()
    {
        this.app = express();
        this.httpServer = http.createServer( this.app );
        this.io = io( this.httpServer );

        this.app.use(express.static( __dirname + "/public" ));

    }

    handleRoutes()
    {
        this.app.get( "/", (req, res) => {
            res.send( `Helloooo World!!!!` );
        });



    handleSocketConnection()
    {
        this.io.on( "connection", socket => {
            console.log("New Socket Created!");
            const existingSocket = this.activeSockets.find(
                existingSocket => existingSocket === socket.id
                );
            
                if (!existingSocket) {
                    this.activeSockets.push(socket.id);
                
                    socket.emit("update-user-list", {
                        users: this.activeSockets.filter(
                        existingSocket => existingSocket !== socket.id
                        )
                    });
                
                    socket.emit("cid", socket.id);

                    socket.broadcast.emit("update-user-list", {
                        users: [socket.id]
                    });
                }

                socket.on( "call-user", data => {
                    console.log("Call users: Offer", data);
                    socket.to( data.to ).emit( "call-made", {
                        offer: data.offer,
                        socket: socket.id
                    });
                } )
                socket.on("make-answer", data => {
                    console.log(`MA:`)
                    console.log( data )
                    socket.to(data.to).emit("answer-made", {
                      socket: socket.id,
                      answer: data.answer
                    });
                  });
                socket.on("disconnect", () => {
                    console.log("User dissconected");
                    this.activeSockets = this.activeSockets.filter(
                      existingSocket => existingSocket !== socket.id
                    );
                    socket.broadcast.emit("remove-user", {
                      socketId: socket.id
                    });
                  });
        });
    }

    listen( callback )
    {
        this.httpServer.listen( this.PORT, () => {
            callback( this.PORT );
        });
    }

}

const s = new Server();

s.listen( port => {
    console.log(`Server is listening on ${port}`);
} );

