
/**
 * NOTE:
 * I feel that meshes and text (aka. things that can be rendered)
 * should proberly inherit from a base class. However, im not 100% sure
 * how it should be implermented atm. So for now we're only going to
 * implerment polgon meshes. until i get more time to work out how 
 * the viewport, renderer and meshes work together.
 * 
 */
export class Mesh
{
    constructor( points, options={}, collider=null )
    {
        // TODO: should poberly use getters for these
        this.points = points;
        this.options = options;
        this.collider = collider;

        this.drawAxis = false;

    }

}