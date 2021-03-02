# Running Intergration test
to run intergration test run 'npm run test-inter'
Intergration test DO NOT run when using 'npm run test-node'
Since they are the node unit-test and therefor dont require
any "live" instance running.

# Setup
**Importent**

For the intergration test to work the signaling server must NOT be running
Since we create our own instance of the server.

This is a limitation caused by the wwwConfig.com.js file being imported where
its needed rather than having the values supplied to the objects that need 
require them.

There are plans for this to change later.

# Note to self. this limatation has been lifted!