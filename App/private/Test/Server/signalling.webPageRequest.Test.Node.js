
// Test that we can access publicy available web pages.
import { WWW_ADDRESS as WWW_ADDR, COMMON_ADDRESS as WWW_COMMON } from "../../../common/wwwConfig.com.js";
import request from "request";
import chai from "chai";

const assert = chai.assert;
const expect = chai.expect;

// TODO: This should be moved into the intergration test folder.
//       And should also create it own instance of the singnalling server.
//       We can use the befor and after method in mosch to start and stop 
//       the server. See: https://mochajs.org/#hooks
//
// NOTE: The signalling server must be running for these test to pass
describe( '(INTERGRATION) Test access to the WWW public directories', () => {
    
    it( "should load /index.html with status 200", ( done ) => {

        var page_request = {
            url: `${WWW_ADDR}index.html`,
            timeout: 1000                   // 1 sec
        }

        request( page_request, (err, res, body) => {
            if ( err )
            {
                assert.fail("Error: "+err);
                done();
            }
            assert.equal(res.statusCode, 200);
            done();
        });

    });

    it( "should load /includes/js/main.native.js with status 200", ( done ) => {

        var page_request = {
            url: `${WWW_ADDR}/includes/js/main.native.js`,
            timeout: 1000                   // 1 sec
        }

        request( page_request, (err, res, body) => {
            if ( err )
            {
                assert.fail("Error: "+err);
                done();
            }
            assert.equal(res.statusCode, 200);
            done();
        });

    });

    it( "should load /includes/style.css with status 200", ( done ) => {

        var page_request = {
            url: `${WWW_ADDR}/includes/style.css`,
            timeout: 1000                   // 1 sec
        }

        request( page_request, (err, res, body) => {
            if ( err )
            {
                assert.fail("Error: "+err);
                done();
            }
            assert.equal(res.statusCode, 200);
            done();
        });

    });

    it( "should not load /doesNotExist.html with status 404", ( done ) => {

        var page_request = {
            url: `${WWW_ADDR}doesNotExist.html`,
            timeout: 1000                   // 1 sec
        }

        request( page_request, (err, res, body) => {
            if ( err )
            {
                assert.fail("Error: "+err);
                done();
            }
            assert.equal(res.statusCode, 404);
            done();
        });

    });

});

/** Coomon Directory */
describe( '(INTERGRATION) Test access to the WWW common directorys', () => {
    it( "should load /common/wwwConfig.com.js with status 200", ( done ) => {

        var page_request = {
            url: `${WWW_COMMON}wwwConfig.com.js`,
            timeout: 1000                   // 1 sec
        }

        request( page_request, (err, res, body) => {
            if ( err )
            {
                assert.fail("Error: "+err);
                done();
            }
            assert.equal(res.statusCode, 200);
            done();
        });

    });

    it( "should not load /common/doesNotExist.js with status 404", ( done ) => {

        var page_request = {
            url: `${WWW_COMMON}doesNotExist.js`,
            timeout: 1000                   // 1 sec
        }

        request( page_request, (err, res, body) => {
            if ( err )
            {
                assert.fail("Error: "+err);
                done();
            }
            assert.equal(res.statusCode, 404);
            done();
        });

    });
});
    /** Javascript Test Directory */
describe( '(INTERGRATION) Test access to the WWW test directorys', () => {
    it( "should load /test/index.html with status 200", ( done ) => {

        var page_request = {
            url: `${WWW_ADDR}test/index.html`,
            timeout: 1000                   // 1 sec
        }

        request( page_request, (err, res, body) => {
            if ( err )
            {
                assert.fail("Error: "+err);
                done();
            }
            assert.equal(res.statusCode, 200);
            done();
        });

    });

    it( "should load /testDoubles/IO.Fake.com.js with status 200", ( done ) => {

        var page_request = {
            url: `${WWW_ADDR}testDoubles/IO.Fake.com.js`,
            timeout: 1000                   // 1 sec
        }

        request( page_request, (err, res, body) => {
            if ( err )
            {
                assert.fail("Error: "+err);
                done();
            }
            assert.equal(res.statusCode, 200);
            done();
        });

    });

});