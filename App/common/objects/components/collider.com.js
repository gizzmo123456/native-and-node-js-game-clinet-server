import { Vector2 } from "../helpers/Vector2.helper.com.js"
/** 
 * NOTE: This is only a rought implermentation for colliders/triggers
 *       For now only triggers are implermented as its all that 
 *       required for this project.
 * 
 *       This is part of the Viweport/renderer/mesh dilemma
 * 
 */

/**
 * NOTE: collider
 * Also NOTE: Cliiders/triggers are not my strong point :DDDD
 */
export const COLLIDER_MODE = {
    TRIGGER: "trigger",
    COLLIDER: "collider"            // Not implermented
}

export class BaseCollider
{

    constructor( callbackGameObject, colliderMode, offset={x:0, y:0} )
    {
        // the GameObject that should be called if the 
        // collider overlapps or collides with another object
        this.callbackGameObject = callbackGameObject;  
        this.mode = colliderMode;   // should it function as a trigger or collider.

        // the max distance away from the center  
        // that can be considered for a collision
        this.__maxDistance = 0;             
        this.__worldPosition = {x:0, y:0};
        this.__offset = offset;           
        this.__translatedOffset = this.__offset;

        this.__data = {}            // Any collision or trigger data

        this.__tags = []

    }

    get GameObject()
    {
        return this.callbackGameObject;
    }

    get MaxDistance()
    {
        return this.__maxDistance;
    }

    /** The world position including the offset */
    get WorldPosition() // It might be better if this value was catched
    {
        return {
            x: this.__worldPosition.x + this.__translatedOffset.x,
            y: this.__worldPosition.y + this.__translatedOffset.y
        }
    }

    ContainsTag( tag )
    {
        return this.__tags.includes( tag )
    }

    SetTags( ...tags )
    {
        this.__tags = tags
    }

    AddTags( ...tagsToAdd )
    {
        this.__tags = [ ...this.__tags, ...tagsToAdd ]
    }

    /**
     * Updates the colliders position and mesh.
     * This MUST only be called in Viewport.ProcessGameObject( ... )
     * 
     * @param {*} transform         The game objects current transform
     * @param {*} mesh              The processed mesh  (Note mesh will always be supplied in ProcessGO even if it not needed)
     * @param {*} meshMaxDistance   The distance to the furthest mesh point away from the center
     */
    PreResolveUpdate( transform, mesh=null, meshMaxDistance=0 )
    { 
        this.__worldPosition = transform.position;
        this.__translatedOffset = transform.RotatePointByTransform( this.__offset );
    }

    Resolve( otherCollider )
    {
        // if there both the same we can just either overlap method
        // otherwise we must use the polygone collider overlap method
        let overlapMethod = this.Overlap.bind( this );
        let other = otherCollider

        if ( !(this instanceof PollygonCollider) )
        {
            overlapMethod = otherCollider.Overlap.bind( otherCollider );
            other = this;
        }

        if ( overlapMethod( other ) )
        {
            // Callboth interacting colliders.
            // We supply both this collider and the otherCollider so if a 
            // GO has more than one collider we can find which one interacts
            this.callbackGameObject.OnTrigger( this, otherCollider, this.__data );
            otherCollider.callbackGameObject.OnTrigger( otherCollider, this, this.__data );
            return true;
        }

        return false;

    }

    /**
     * Is the point in range of maxDistance (for both this and the other collider)
     * @param {Vector2} point the point in 2d world space
     */
    ColliderInRange( otherCollider )
    {
        let dist = Vector2.Distance( otherCollider.WorldPosition, this.WorldPosition );

        return  dist <= this.__maxDistance + otherCollider.__maxDistance;

    }

    /**
     * Is the point in range of maxDistance
     * @param {Vector2} point the point in 2d world space
     */
    PointInRange( point )
    {
        return Vector2.Distance( point, this.WorldPosition ) < this.__maxDistance;
    }

    /** (abstract)
     * finds if to colliders overlap.
     * Must be either
     * trigger X trigger
     * trigger X collider
     * @param {*} otherCollider 
     */
    Overlap( otherCollider ){}

    /** (abstract) NOT IMPLERMENTED
     * 
     * finds if two colliders have collided
     * Must be 
     * collider X collider
     */
    Collision( otherCollider ){ throw "Not Implermented"; }
    
    /**
     * Gets the generated collision or trigger data
     */
    get Data()
    {
        return this.__data;
    }

    Draw( renderer ){ } // TODO...

}

export class RadiusCollider extends BaseCollider
{
    constructor( callbackGameObject, colliderMode, offset={x:0, y:0} )
    {

        super( callbackGameObject, colliderMode, offset)

        this.radius = 0.5;
        this.scale = 1;     // For now we'll just use the average of the X and Y axis

    }

    PreResolveUpdate( transform )
    {

        super.PreResolveUpdate( transform );

        let scale = ( transform.scale.x + transform.scale.y ) / 2.0;
        this.__maxDistance = this.radius * scale;

    }

    Overlap( otherCollider )
    {

        let dist = Vector2.Distance( this.WorldPosition, otherCollider.WorldPosition );
        // find if one collider is in the other. ignores if touching
        // This is only acurate for to radius colliders. (but its good enought for this project for now at least)
        return dist < (this.__maxDistance + otherCollider.__maxDistance)

    }

}

export class PollygonCollider extends BaseCollider
{
    constructor( callbackGameObject, colliderMode, offset={x:0, y:0} )
    {
        super( callbackGameObject, colliderMode, offset )

        this.mesh = []  // Array of translated 2d points

    }

    PreResolveUpdate( transform, mesh, meshMaxDistance )
    { 
        super.PreResolveUpdate( transform )
        this.mesh = mesh;
        this.__maxDistance = meshMaxDistance
    }

    Overlap( otherCollider )
    {

        let otherIsRadius = otherCollider instanceof RadiusCollider;
        var overlapping = false;

        // first off if the other collider is a radius find if position point is in range, as this is the cheapest method to detect if overlaping
        // otherwise test the polygons tri's
        if ( otherIsRadius )
        {
            overlapping = otherCollider.PointInRange( this.WorldPosition )
        }

        if ( !overlapping )
        {
            overlapping = this.TestTriangles( otherCollider, otherIsRadius )
        }

        return overlapping

    }

    TestTriangles( otherCollider, otherIsRadius )
    {
        // Fanout the polgon so we can test if a point is 
        // within one of the triangles using barycentric collision
        const origin = this.mesh[0]

        // if testing againts a radius test if the first point points are in range

        if ( otherIsRadius && ( otherCollider.PointInRange( origin ) || otherCollider.PointInRange( this.mesh[1]) ) )
        {
            return true;
        }

        // start on two since there must be 3 points to make a triangle
        // do one extra loop in case there collider has not been closed
        for ( let i = 2; i <= this.mesh.length; i++ )
        {

            let point1 = this.mesh[i-1];
            let point2;

            // Close the polygon if needed
            if ( i < this.mesh.length )
                point2 = this.mesh[i];
            else if ( this.mesh[0].x == point1.x && this.mesh[0].y == point1.y )
                break;  // exit loop if the last point matches the start
            else        
                point2 = this.mesh[0]; // close polygon

            //
            if ( otherIsRadius )
            {
                /**
                 * Test the pollygon collides/overlaps a radius collider 
                 * 1. test if the pollygon point is within the radius collider
                 * 2. test if the edge of the pollygon intercepts the radius collider
                 * 3. test if the radius collider is inside the pollygon 
                 */  
                if ( otherCollider.PointInRange( point2 ) ) // Test 
                {
                    return true;
                }
                else if ( this.EdgeInterceptsRadius( point1, point2, otherCollider.WorldPosition, otherCollider.radius ) )
                {
                    return true;
                }
                else if ( this.PointInTriangle( otherCollider.WorldPosition, origin, point1, point2 ) )
                {
                    return true;
                }
                
            }
            else
            {
                // TODO: pollygon vs pollygon collision. (i cant see the need for this in this project)
                // But if i do this where i should put the code :DDDD
                return false;
            }


        }

        return false;

    }

    // TODO: i feel that some of the data in PointInTriangle and LineInterceptsRadius could be catched

    PointInTriangle( point, tri0, tri1, tri2 )
    {
        // See (book) Real-Time Collision Detection pg.46-48 
        // and https://github.com/Ashley-Sands/comp270-worksheet-D/blob/master/comp270-worksheet-D/Drifter.cpp 
        // and https://gamedev.stackexchange.com/questions/23743/whats-the-most-efficient-way-to-find-barycentric-coordinates
        // and Real-Time Collision Detection pg.46-48

        //NOTE: TODO: any value that does not calulate using point can be catched the first time on each frame

        // find the vectors from the origin (tri0) to each of the other 3 points
        let originToTri_1 = {   
            x: tri1.x - tri0.x,
            y: tri1.y - tri0.y
        }

        let originToTri_2 = {   
            x: tri2.x - tri0.x,
            y: tri2.y - tri0.y
        }

        let originToPoint = {   
            x: point.x - tri0.x,
            y: point.y - tri0.y
        }

        let dotTri1  = Vector2.Dot( originToTri_1, originToTri_1 );
        let dotTri2  = Vector2.Dot( originToTri_2, originToTri_2 );
        let dotTri12 = Vector2.Dot( originToTri_2, originToTri_1 );

        let dotTri1p = Vector2.Dot( originToTri_1, originToPoint );
        let dotTri2p = Vector2.Dot( originToTri_2, originToPoint );

        let denormal = 1 / (dotTri2 * dotTri1 - dotTri12 * dotTri12)    // this can be catched
        let x = (dotTri1 * dotTri2p - dotTri12 * dotTri1p) * denormal
        let y = (dotTri2 * dotTri1p - dotTri12 * dotTri2p) * denormal

        return x >= 0 && y >= 0 && (x + y < 1);

    }

    EdgeInterceptsRadius( lineP1, lineP2, radiusCenter/*c*/, radius/*r*/ )
    {
        // See for more info: https://stackoverflow.com/questions/1073336/circle-line-segment-collision-detection-algorithm

        let lineVector = {              //d
            x: lineP2.x - lineP1.x,
            y: lineP2.y - lineP1.y
        }

        let centerVector = {            // f
            x: lineP1.x - radiusCenter.x, 
            y: lineP1.y - radiusCenter.y
        }

        let lineDot = Vector2.Dot(lineVector, lineVector);
        let centerLineDot = 2 * Vector2.Dot( centerVector, lineVector);
        let centerDot = Vector2.Dot( centerVector, centerVector ) - radius*radius;

        var disc = centerLineDot*centerLineDot-4*lineDot*centerDot;

        if ( disc < 0)
        {
            return false;
        }
        else
        {
            disc = Math.sqrt( disc );
            let t1 = ( -centerLineDot - disc)/(2*lineDot);
            let t2 = ( -centerLineDot + disc)/(2*lineDot);

            if ( t1 >= 0 && t1 <= 1 )
            {
                return true;
            }

            if ( t2 >= 0 && t2 < 1 )
            {
                return true;
            }

        }

        return false;

    }

}

export class BoxCollider extends BaseCollider
{
    constructor( callbackGameObject, colliderMode, offset={x:0, y:0} )
    {

        super( callbackGameObject, colliderMode, offset)
        
        this.__size = {
            width: 1,
            height: 1
        }

        this.__bounds = {
            min: {x:0, y:0},
            max: {x:0, y:0}
        }

        this.translatedBounds

    }

    set Size( size )
    {
        
        this.__size = size;
        let half = {
            x: size.x / 2,
            y: size.y / 2
        }

        this.__bounds.min = {x: -half.x, y: -half.y};
        this.__bounds.max = half;

    }

}
