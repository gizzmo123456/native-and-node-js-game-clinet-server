# README.md

```NOTE: this document is a work in progress ```

{name TBC} is a basic online game engine writen in JavaScript to run in both native web apps and NodeJs applications.

This directory contains all the app code for:

- Native JS Client
- Node JS Client
- Node JS HTTP and Signaling server

```TODO. Fill this out a little more :P ```

## Naming Convention

| name 		  | discription 			 				  |
| ----------- | ----------------------------------------- |
| *.native.js | Native JavaScript script 				  |
| *.node.js	  | Node js script 			 			   	  |
| *.com.js 	  | Common script for both node and native js |

## Directory Layout

[/App] (root)

| file / dir     | discription 			 				  |
| -------------- | -------------------------------------- |
| ./public	  	 | public directory  (Nayive JS app)  	  |
| ./private      | private directory (Node.js app)		  |
| ./common		 | common (public) directory (common to Native and Node.js app) |
| ...			 | ... |
| ./private/test | Contains all unit and intergration testing scripts  |

## Entry points

| file path                       | discription                            |
| ------------------------------- | -------------------------------------- |
| ./main.node.js                  | HTTP ans Signalling server             |
| ./private/gameMiddlebox.node.js | Game Middlebox (server)<br/>use flags 'ws' for webSocket mode and 'rtc' for webRTC mode<br />```Example 'run gameMiddlebox.node.js rtc'``` |
| ./private/client.node.js        | Node Client                            |
| 0.0.0.0:8333 (localhost:8333)   | Browser client (main.node.js must be running) |
| localhost:8333/test             | Browser unit test (localhost only see below) |

## Exposed HTTP Directories
| http path | directory | discription |
| --------- | --------- | ----------- |
| /         | ./public/ | root HTTP directory   |
| /common   | ./common/ | common code directory |
| /test    | ./private/test/client/javascript  | Only exposed when listening on 'localhost'. Root unit-test path |

## Starting and Configuring (TODO.)
### HTTP and Singaling Server

### Javascript and node js Client
The signaling and WebSocket address and ports can be configured for the js and nodejs client in ```./common/wwwConfig.com.js``` by default both address are set to ```localhost``` on port 8333 for signaling and 9333 for the WebSocket connection.

### Signaling Server config
When starting the signaling server via command line the address and port can be passed as arguments. format: address port ie ```node ./main.node.js 0.0.0.0 5555``` to bind to all available address on port 5555. if not supplied default values are ```localhost 8333```

### WebSocket Game server
When starting the game server in WebSocket mode via command line the address and port can be passed as arguments. format: address port ie ```node .private/gameMiddlebox.node.js 0.0.0.0 6666``` to bind to all available address on port 6666. if not supplied default values are ```localhost 9333```

### WebRTC Game Server
WebRTC has no futher address or port config, as the client and game server will negotiate this at run time via the signaling server.

```
Note: when running on Ubuntu replace 'node' with 'nodejs' in the above commands
```


## Useing npm
If the client and server is running locally you can use the ```npm run``` commands from the ```App\``` directory to start the components with the default configuration.
### Run HTTP and singnalling
```npm run start-server```
### Run Game Middlebox (Server) in Websocket Mode
```npm run start-middlebox-ws```
### Run Game Middlebox (Server) in WebRTC Mode
```npm run start-middlebox-rtc```

### Run Node client
```npm run start-client```
### Run all test
```npm run test-node```
### Run HTTP/Signalling test
```npm run test-server```
### Run Middlebox test
```npm run test-middlebox```
### Run client test
```npm run test-client```
### Run Intergration test
**Importent see the [Intergration Test setup](./private/Test/IntergrationTest/Setup.readme.md) for more info**
```npm run test-inter```




