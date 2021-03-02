import { Component } from "./base/component.com.js";

// Genral input manager (client and server)
// Use this for the server
// Use inputs.native.js for web browsers clients
// Use inputs.node.js for node clients.
// (both .native and .node extend on this)
export class Inputs extends Component
{

    constructor( uid, componentOwner, net_sync )
    {
        super( uid, componentOwner, net_sync );

        this.mousePosition = {
            x: 0,
            y: 0
        };

        this.mouseDown = {}
        this.keyDown = {};

    }

    IsKeyDown( key )
    {
        return key in this.keyDown && this.keyDown[ key ] > 0;
    }

    IsMouseDown( mouseButton )
    {
        return mouseButton in this.mouseDown && this.mouseDown[ mouseButton ] > 0;
    }

}