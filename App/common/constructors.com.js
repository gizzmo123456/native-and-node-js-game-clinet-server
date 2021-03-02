// Import all object constructors
import { GameObject } from "./objects/gameObjects/base/gameObject.com.js"
import { Car } from "./objects/gameObjects/car.com.js"
import { Explosion } from "./objects/gameObjects/explosion.com.js";
import { Missile } from "./objects/gameObjects/missile.com.js";
import { Tank } from "./objects/gameObjects/tank.com.js"
import { TankTurret } from "./objects/gameObjects/tankTurret.com.js"

/**
 *  use for components that differ betweeen native js and node js
 */
export class Constructors
{

    static dataPacket = null;
    static inputs = null;

}

/**
 *  Stores all object constructors that can be created over the network.
 * 
 *  See: https://github.com/Ashley-Sands/JS-Python-game-and-server/blob/master/js%20-%20client/includes/javascript/imports.js
 *  It might be a better solution in the long run. It would alow to import the class at runtime, however
 *  would need a solution for fileNames and paths. ie.
 *  fileNames would have to be the same as the class (simular to unity) also,
 *  every file would need to be in the same folder, no sub directorys so would need a solution for that.
 */
export class Objects
{
    // the key must match the class name. ie.
    // {
    //   "GameObject": GameObject  
    // }

    // using a static get prevents it from throwing
    // error 'can not access class untill initalized' 
    // (or somthink like that)
    static get constructors()
    {
        
        return { 
            "GameObject": GameObject,
            "Car": Car,
            "Tank": Tank,
            "TankTurret": TankTurret,
            "Missile": Missile,
            "Explosion": Explosion
        };
        
    }

}