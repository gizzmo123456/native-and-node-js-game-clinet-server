
import {BaseTrack} from "./baseTrack.com.js";

class RaceTrack_Drag0 extends BaseTrack
{

    get Background()
    {
        let bg = super.Background
        bg.color = "#555555"
        bg.image.src = "/includes/images/DragStrip-0.png"
        bg.image.scale = {x: 2, y: 2}
        bg.image.position = {x: 0, y: 0}
        return bg;
    }

}