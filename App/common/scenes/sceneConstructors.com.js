/**
 * This class is a method to sort all of the avilable scenes.
 * So they can be loaded from network message.
 * Its a bit like the build settings in Unity :)
 */

import { TestScene } from './testScene.com.js';
import { RaceTrack_Circuit0 } from './RaceTracks/track-Circuit-0.com.js';
import { RaceTrack_Drag0 } from './RaceTracks/track-drag-0.com.js';



export class Scenes
{
    static get constructors () 
    {
        return {
            test: TestScene,
            raceCircuit0: RaceTrack_Circuit0,
            raceDrag0: RaceTrack_Drag0
        }
    }
}
