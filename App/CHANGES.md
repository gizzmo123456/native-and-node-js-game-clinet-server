# Change Log

intitial development started [DATA HERE]

### Log stated 13/01/21

- Changed 'networkOwnerMode' to 'networkConstructorMode'
- Added componetConstructorMode ALWAYS to make sure that required componets are constructed over the network
- Change ComponetManager to a static class
- Added UpdateNetworkID to ComponentManager
- (TEMP fix) Fixed node.js not calling close on other peers when exiting via webRTC

### 15/01/21
- Added Component init modes.  
  The allows us to set an object to not be network synced and 
  also lets us know if it was created locally or over the network.
- Added Scenes
- Added new events to game manager
  - clientJoin
  - clientLeave
- Fixed Destroy crashing if null game object

### 16/01/21
- Added Mesh component so gameObjects can have multiple meshs.
  - Added Support for multiple messhes to viewport
- Added method to draw the Axis, for debuging :)
- Added Base Vehicle GameObject 
- Added Car GameObject
- Added Tank
  - And Turet

### 17/01/21
- Added Background to scenes
  - Added background colour to canvas renderer Clear method
  - Added background image to canvas render Clear method.
     - background images are positioned in world space and can be scale.
     - There is no support to rotate background iamges
     - There is no support for multiple background images
       This means that if a second scene is loaded the new scenes background will overwrite the current scene background!
  - Added Set background to GameManager LoadScene
  - Updating Scene documentation

### 19/01/21
- Add Packet object to allow use to handle different header and payload formate
  - Added Base Packet
  - Added client/server Packet (this is a single packet atm and could get split into two different packets)

### 20/01/21
- Fixed possiblity of initializing the GameManager more than oce.
- Added timeSinceStart to GameManager.time 
- Added timeSinceStart to the statistics update event.
- Implermented Packet object for handerling network data to the connection and component managers.
- Added drop frame to TickResolver. so the next frame time is corrected, thus preventing the framerate incressing 
- Changed how the header information for a packet is gathered.
- imporved vehicle
  - added breaks
  - added acceleration
  - added friction
- Improved Transform
  - added property to get left and right in world space

### 21/01/21
- Improved Packet.CreateBuffer so it only uses a single Array buffer for the header.
- Added a refrence to the active scene in gameGlobals
- Changed GameManager.LoadScene to the activeScene before loading a new scene.
- Fixed inputs remaining pressed when window loses focuse
- 

### 22/01/21
- Added Colliders with trigger only support (i'll come back to collision if needed)
  - Base Collider
  - Radius Collider
- Implermented Basic collider/trigger detection to Viewport.
- Added collision range indercater for debuging. (If any two circles overlap on different GameObjects then the objects are both considered for a potential collision).

### 02/02/21
- Added first iteration of the network topoligy 

### 03/03/21
- Fixed node application haulting due to the stdout/err buffer filling up when running on mininet host.

### 09/02/21
- Added Empty GameObject class to be used as a starting point for game objects
- Added Projectile 

### 11/02/21
- Fixed not being able to destroy objects that are created with no sync when in network mode 
- Improved preformace of viewport by not scaling meshes that are scaled to 1,1
- Added explsion
- Added GameObject linker so that gameObjects that are created on the network can be linked back together 
- Linked tank turet to to the tank body over the network
- Changed tank turret to fire missiles :P

### 13/02/21
- improved collider processing performance 
- Add call to other GameObject on trigger (so both GO are now called on collision )
- Added Colliders/triggers to tank and misiles
- Added tags to colliders
- Added Damage to explosion
- Add helath to tanks
- Added Explosion to tank when dies.


### 14/02/21
- Added offset to colliders 
- Added board to drawPolly in canvasRenderer 
- Change fill to optional in drawPolly

### 16/02/21
- Change viewport to use matrix 

### 19/02/21
- Fished implerment matrix which has improved performance (it has gone from being able to draw 1000 objects to >2000 @ 15fps)
- Minor performance improvments about the viewport and renderer
- Added New RaceTrack Scenes
  - Drag Track 0
  - Race Circet 0

## 20/02/21
- Added worker thread to encode and decode payloads.
  This has helped to redurce the frame drops. 

## 21/02/21
- Fixed mesh colliders not resolving correctly
- Reimplermented the draw collider methods and draw axis method
- Added DEBUG param to toggle logging and other debug options.
- reduced the size of packets by limiting the amount of decimal places a float can be (~30%% reduction in packet size :D)

