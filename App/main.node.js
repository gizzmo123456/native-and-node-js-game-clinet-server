import {Server} from "./private/signallingServer.node.js"
/**
 * starts the singnalling server.
 *  Args
 *   [0] address. default: localhost
 *   [1] port     default: 8333
 *   example to broadcast to any ip available on port 8444
 *   node ./main.node.js 0.0.0.0 8444
 */


var address = "localhost";
var port = 8333;

if ( process.argv.length > 2)
    address = process.argv[2]

if ( process.argv.length > 3)
    address = process.argv[3]

var s = new Server( "thisIsMyPassword", address, port );

s.Init();
s.Listen();
