# Scenes
A scene IS a collection of GameObjects, methods and events.
A scene DOES NOT tick or sync objects. Infact when a 
scene loads all GameObjects/Componets are pushed into
the ComponentManager to be ticked and synced. 
Futhermore, objects that are created over the network 
are NOT get assigned to a scene. As the host (creater) will
destroy the GameObject when the scene is unloaded and 
therefor can be handled by the componetManager. 
In other words, a Scene is a way to group together GameObjects
that are created locally.

A scene also extends the Create and Destroy functinality and should be
perfered over the ComponentManager.Create/Destroy moethods.

```
- events
	- OnClientJoin( peerSocket )	-> Triggered when a new client jopints
	- OnClientLeave( peerSocket )	-> Triggered when an existing client leaves

- Methods
	LoadScene()						-> Loads the scenes objects into the componet manager.
	UnloadScene()					-> Unloads all the scenes objects from the compoent manager.
	Create( goType, InitMode)		-> Extends ComponetManager.Create
	Destroy( gameObject)			-> Extends ComponetManager.Destroy

```

## Implermenting local scene objects
**To be load on loadScene (All objects are loaded with the NO_SYNC attrabute)**
Override the GET property 'LocalSceneObject' which returns an array of arrays containing the 
GameObject Type and (optinal) serialized callback.

Example
```
//...
get LocalSceneObject(){
	return [
		[GameObject, go => {
			go.transform.position = {x: 10, y: -10}
			go.transfrom.rotation = 45
		}],
		[GameObject, go => {
			go.transform.position = {x: 5, y: 8}
			go.transfrom.rotation = -22
		}]
	]
}
//...

```
The Above example will spwan 2 GameObjects, the first at position 10, -10 rotated 45 degres
and the second at position 5, 8 roated -22 degres

## Implermenting Sync objects on LoadScene. (Not Implermented (TODO))
Override the Init() method and create objects using the scenes Create method with the default InitMode.

Example
```
Init()
{
	let obj = this.Create( GameObject );
	obj.transform.position = {x: 10, y: -10};
	obj.transform.rotation = 45;

	obj = this.Create( GameObject );
	obj.transform.position = {x: 5, y: 8};
	obj.transform.rotation = -22;
}
```
The above example Creates two game objects (in the same state as the local example)
except both will be broadcasted over the network. (if permited)

```
NOTE: objects can be created locally in Init as well using 
'this.create( Object, GameObject.COMPONENT_INIT_MODES.NO_SYNC )'
No method is perfered over the other
```

## Setting the Scene Background (color and image)
**Importent Limitations**  
At the current time only one background can be applied to the canvasRenderer,
this means that if another scene is loaded it will overwrite the previous scenes
background.  
Also Background can not be rotated!  

**Setting the background**  
Override the GET background property with an object containing a key for 'color' and 'image'
both of witch are optional.

Example
```
    get Background()
    {
        return {
            color: "#ffffff",                                   // (optinal) The background colour of the scene
            image: {                                            // (optinal) the background image to use
                src: "https://placekitten.com/1400/1000",       // the url of the image.
                position: {x: -15, y: 10},                      // the world position in units the background image should be positioned
                scale: {x: 1, y: 1}                             // (optinal) the scale of the background image
            }
        }
    }
```

## More Information
```
Note: It is the developers responciblity to track object ownership. As GameObjects do NOT have any functionality for ownship. 
Internal onwership is handled at the component, since its the componets that are synced between the client and server rather than the GameObjects them selfs.

Futhermore, for componets to be synced they must be configured correctly (see 'Componet.com.js' for futher information)

Also Note: that syncing it handled by the componentManager.
```






===
### Idears

### OnComponentOwnerChange -> Params: Component: Componet (that changed), PeerSocker : oldOwner=null, PeerSocket : newOwner= null
Called when a component that belongs to the scene has it owner changed.


