import chai from "chai";
import { RTCPeer } from "../../../../common/peerSocket.com.js"
import { FakeRTCEventListener, FakeRTCDataChannel } from "../../testDoubles/WRTC.Spy.com.js"

import wrtc from 'wrtc';
const { RTCPeerConnection, RTCSessionDescription} = wrtc;

const assert = chai.assert;
const expect = chai.expect;

describe("(UNIT) Test WebRTC Peer binds onto the correct events", () => {

    it ( "this.connection should bind onto event 'dataChannle' when started", (done) => {

        RTCPeer._RTCPeerConnection = FakeRTCEventListener
        var rtcPeer = new RTCPeer( "ClientID" );

        rtcPeer.Init();

        assert.isTrue( "datachannel" in rtcPeer.connection.bindedEvents );
        done();

    });

    it ( "check 'open' binds onto the datachannel when created", (done) => {

        RTCPeer._RTCPeerConnection = FakeRTCEventListener
        var rtcPeer = new RTCPeer( "ClientID" );
        var rtcDataChannel = new FakeRTCDataChannel();

        rtcPeer.Init();
        rtcPeer.connection.triggerBindedMessage( "datachannel", rtcDataChannel );

        assert.isTrue( "open" in rtcDataChannel.bindedEvents );
        done();

    });

    it ( "check 'close' binds onto the datachannel when created", (done) => {

        RTCPeer._RTCPeerConnection = FakeRTCEventListener
        var rtcPeer = new RTCPeer( "ClientID" );
        var rtcDataChannel = new FakeRTCDataChannel();

        rtcPeer.Init();
        rtcPeer.connection.triggerBindedMessage( "datachannel", rtcDataChannel );

        assert.isTrue( "close" in rtcDataChannel.bindedEvents );
        done();

    });

    it ( "check 'message' binds onto the datachannel when created", (done) => {

        RTCPeer._RTCPeerConnection = FakeRTCEventListener
        var rtcPeer = new RTCPeer( "ClientID" );
        var rtcDataChannel = new FakeRTCDataChannel();

        rtcPeer.Init();
        rtcPeer.connection.triggerBindedMessage( "datachannel", rtcDataChannel );

        assert.isTrue( "message" in rtcDataChannel.bindedEvents );
        done();

    });

});

// For some reasion this set of test casues mocha to exit with status 3221226356
// But it does not effect the out come of the test.
// I think its calused by a know issue in Node.js wrtc . 
// See: https://github.com/node-webrtc/node-webrtc/issues/576
// and: https://github.com/node-webrtc/node-webrtc/issues/458
// it might just be a case that we have to close the data channle fist!
//
describe("(UNIT) Test WebRTC Peer creates an offer and anwser", async () => {

    it ( "should return a vaild offer", async ( ) => {

        RTCPeer._RTCPeerConnection = RTCPeerConnection;
        RTCPeer._RTCSessionDescription = RTCSessionDescription;

        var rtcPeer = new RTCPeer( "ClientID" );
        rtcPeer.Init();

        var offerMade = await rtcPeer.CreateOffer();
        rtcPeer.connection.close(); // close the connection  so the test can end

        assert.isTrue( 'type' in offerMade );
        assert.equal( offerMade["type"], 'offer' );
        assert.isTrue( 'sdp' in offerMade );

    })

    it ( "should return a valid answer", async () => {

        RTCPeer._RTCPeerConnection = RTCPeerConnection;
        RTCPeer._RTCSessionDescription = RTCSessionDescription;

        // Create two peers one to create an offer and the other to create the answer
        var rtcPeer_1 = new RTCPeer( "ClientID-1" );
        rtcPeer_1.Init();

        var rtcPeer_2 = new RTCPeer( "ClientID-2" );
        rtcPeer_2.Init();

        var offerMade = await rtcPeer_1.CreateOffer();
        var answer = await rtcPeer_2.HandleOffer( offerMade );

        rtcPeer_1.connection.close(); // close the connection  so the test can end
        rtcPeer_2.connection.close(); // close the connection  so the test can end
        
        assert.isTrue( 'type' in answer );
        assert.equal( answer["type"], 'answer' );
        assert.isTrue( 'sdp' in answer );
    })

});

