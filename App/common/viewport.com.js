import { Vector2 } from './objects/helpers/Vector2.helper.com.js'
import { Transform } from './objects/components/transform.com.js'
import { PollygonCollider } from './objects/components/collider.com.js'
import { Matrix3x3 } from './objects/components/base/Matrix3x3.com.js'

/**
 * The viewport can thought of as the camera,
 * Although it does not do any rendering,
 * it just repersents the viewable area of the current world.
 */

 export class Viewport
 {

    constructor( viewportSize={x: 800, y: 600}, pixelsPerUnit=48, renderer=null )
    {
        // TODO:
        this.grid ={
            draw: true,
            spacing: 1 // units
        };

        this.size = viewportSize;
        this.pixelsPerUnit = pixelsPerUnit;

        this.__position = {     // units   // this can be in world space now ?? 
            x: 0,
            y: 0
        }

        this.__rotation = 0;

        this.cameraMatrix = new Matrix3x3();

        this.matrix = new Matrix3x3();
        this.matrix.SetPosition( this.size.x/2, this.size.y/2 );    // center the viewport of 0, 0
        this.matrix.SetScale( this.pixelsPerUnit, this.pixelsPerUnit );

        this.renderer = renderer;
                
        if ( renderer ) // this must be called affter size, ppu and matrix since it depends on thos values.
            this.renderer.SetViewport( this );




        this.colliders = [] // a list of found colliders to be resolved
    }

    /**
    * gets a copy of position (in units)
    */
    get Position()
    {
        return {
            x: this.__position.x,
            y: this.__position.y
        }
    }

    /**
     * Sets position in units
     */
    set Position( position )
    {
        this.__position = {
            x: position.x,
            y: position.y
        }

        this.cameraMatrix.SetPosition( position.x, position.y );

    }

    set Rotation( rot )
    {
        this.__rotation = rot;
        this.cameraMatrix.SetRotation( rot );
    }

    /**
     * Gets the bounds in units
     */
    get BoundsPixels()
    {
        var bounds = this.Bounds;

        return {
            xMin: bounds.xMin * this.pixelsPerUnit,
            xMax: bounds.xMax * this.pixelsPerUnit,

            yMin: bounds.xMin * this.pixelsPerUnit,
            yMax: bounds.xMax * this.pixelsPerUnit
        }

    }

    /**
     * Gets the bounds in units
     */
    get Bounds()
    {

        return {
            xMin: this.__position.x,
            xMax: ( this.__position.x + this.size.x / this.pixelsPerUnit ),

            yMin: this.__position.y,
            yMax: ( this.__position.y + this.size.y / this.pixelsPerUnit )
        }

    }

    SetBackground( backgroundOptions )
    {
        if ( this.renderer )
            this.renderer.SetBackground( backgroundOptions );
    }

    /**
    * I feel i shoud be using a 2d transformation matrix to transform the points,
    * But its not a strong point.
    * https://www.tutorialspoint.com/computer_graphics/2d_transformation.htm
    */
    /**
     * Determines if the GameObject is visable to the viewport
     * and pushes it to the renderer if available (and visable)
     * @param {GameObject} gameObject 
     */
    ProcessGameObject( gameObject )
    {
        
        if ( gameObject.meshes.length == 0 )
            return; // nothing to render
        
        var transformMatrix = Matrix3x3.GetMatrixFromTransformReleventTo( gameObject.transform, this.Position );
        var transformMatrix_world = Matrix3x3.GetMatrixFromTransform( gameObject.transform );
        
        // TODO: this could be passed off to a web worker
        gameObject.meshes.forEach( mesh => {

            var isVisable = false;
            var points = [];     // points in viewport space
            
            // We only need the maxDistance if theres a collider, which we set in the mesh. 
            // This so so we can find if any other colliders could possibly collide.
            var maxPointDistance = -1;  // local to the GO. // TODO: we could do min to??
            var hasCollider = mesh.collider != null;
            var processMeshForCollider = mesh.collider instanceof PollygonCollider;
            var colliderPoints = [] ;   // point in world space .

            // Apply the matrix to each point in a pollygon and/or collider
            // TODO. Rotate Viewport    // << i need to learn more about matrix for this.

            mesh.points.forEach( element => {
                
                // transform the mesh and collider
                // Note that collisions are caculated in world space while,
                // meshes are draw relevent to the camera
                var point = transformMatrix.Multiply( element.x, element.y )            // transform to camera space for drawing
                var cPoint = transformMatrix_world.Multiply( element.x, element.y )     // transform to world space for colliders
                
                if ( processMeshForCollider )
                {
                    // Process the mesh for colliders now so the point does not need to be rotated again
                    maxPointDistance = Math.max( maxPointDistance, Math.max( point.x, point.y ) );
                    colliderPoints.push( {
                                            x: cPoint.x,
                                            y: cPoint.y 
                                        } );
                }

                point = this.matrix.Multiply(point.x, point.y);                 // transform to viewport space
                
                points.push( point );

                
            } );

            /**
             * NOTE:
             * For now only trigger has been implermented, when collision
             * are done, i feel it should only render objects that cant have 
             * collision ie. GO with no colliders or colliders set to trigger.
             * then render thoses objects once the collisions are resolved.
             * As collision must be resolved affter all meshes have been processed.
             */
            // update the collider and resolve any collisions, triggers ect..
            if ( hasCollider )
            {
                let collider = mesh.collider;
                collider.PreResolveUpdate( gameObject.transform, colliderPoints, maxPointDistance );
                this.ResolveCollisions( collider );
            }

            if ( this.renderer )
            {
                // push onto the renderer if visable
                if ( true )//isVisable )
                {
                    this.renderer.DrawPolly( points, mesh.options )
                }
                
                if (mesh.drawAxis)
                {
                    
                    let start = {
                        x: gameObject.transform.position.x - this.Position.x,
                        y: gameObject.transform.position.y - this.Position.y
                    }

                    let fwr_end = {
                        x: start.x + gameObject.transform.Forwards.x,
                        y: start.y + gameObject.transform.Forwards.y
                    }

                    let right_end = {
                        x: start.x + gameObject.transform.Right.x,
                        y: start.y + gameObject.transform.Right.y
                    }

                    start =  this.matrix.Multiply( start.x, start.y );
                    fwr_end =  this.matrix.Multiply( fwr_end.x, fwr_end.y );
                    right_end =  this.matrix.Multiply( right_end.x, right_end.y );

                    this.renderer.DrawLine( start, [fwr_end], "#ff000099", 2 )
                    this.renderer.DrawLine( start, [right_end], "#00ff0099", 2 )

                    if ( hasCollider )  // Collider debuging
                    {
                        const colliderStart = points[0];//this.UnitsToPixels( this.WorldToViewport( mesh.collider.WorldPosition ) );
                        //console.log(JSON.stringify(points[0]))
                        if ( colliderPoints.length > 0)
                        {

                            var lastPoint = null;
                            var firstPoint = null
                            mesh.collider.mesh.forEach( colliderPointPosition => {
                                colliderPointPosition.x -= this.Position.x;  // get relevent to camera
                                colliderPointPosition.y -= this.Position.y;
                                colliderPointPosition = this.matrix.Multiply( colliderPointPosition.x, colliderPointPosition.y)
                                let v_s = {
                                    x: colliderPointPosition.x,
                                    y: colliderPointPosition.y - 5
                                }
                                let v_e = {
                                    x: colliderPointPosition.x,
                                    y: colliderPointPosition.y + 5
                                }

                                let h_s = {
                                    x: colliderPointPosition.x - 5,
                                    y: colliderPointPosition.y
                                }
                                let h_e = {
                                    x: colliderPointPosition.x + 5,
                                    y: colliderPointPosition.y
                                }

                                this.renderer.DrawCircle( colliderPointPosition, 3, true);

                                this.renderer.DrawLine( v_s, [v_e], "#ff7777ff", 2 )
                                this.renderer.DrawLine( h_s, [h_e], "#ff7777ff", 2 )

                                if ( lastPoint != null )
                                    this.renderer.DrawLine( lastPoint, [colliderPointPosition], "#ffffffaa", 2 )
                                else 
                                    firstPoint = {x: colliderPointPosition.x, y: colliderPointPosition.y };

                                lastPoint = {x: colliderPointPosition.x, y: colliderPointPosition.y };
                            })
                            //Close the pollgon
                            this.renderer.DrawLine( lastPoint, [firstPoint], "#ffffffaa", 2 )

                        }
                        else
                        {
                            let colliderPosition = mesh.collider.WorldPosition;
                            colliderPosition.x -= this.Position.x;  // get relevent to camera
                            colliderPosition.y -= this.Position.y;
                            this.renderer.DrawCircle( this.matrix.Multiply(colliderPosition.x, colliderPosition.y), mesh.collider.__maxDistance*this.pixelsPerUnit );
                        }

                    }
                }
                
            }
        } );

    }

    ResolveCollisions( collider )
    {
        var maxDist = collider.MaxDistance;
        // iterrate over all of colliders found so far
        // to find if any have collided.
        this.colliders.forEach( coll => {

            // Only consider collisions with other GameObjects
            // that are within the maxDistance
            //if ( collider.GameObject.objectID != coll.GameObject.objectID && collider.ColliderInRange( coll ) )
            if ( collider.ColliderInRange( coll ) )
            {
                // NOTE: It can resolve collision here for now.
                //       Since it i have only implermented triggers for now.
                //       However, When i get round to implermenting collisions
                //       This will have to happen affter it has found all 
                //       the possible collions.
                collider.Resolve( coll );

            }

        })

        // Add the collider to found collider list so
        // if any other colliders are found we can find if
        // it collides with the one.
        this.colliders.push( collider );

    }

    /**
     * 
     * @param {Vector2} worldPosition 
     * @return world in Viewport space (units)
     */
    WorldToViewport( worldPosition )
    {
        var pos = this.Position

        return {
            x: worldPosition.x - pos.x,
            y: pos.y - worldPosition.y      
        }
    }

    UnitsToPixels( units )
    {
        return {
            x: units.x * this.pixelsPerUnit,
            y: units.y * this.pixelsPerUnit,
        }
    }

    PixelsToUnits( pixels )
    {
        return {
            x: pixels.x / this.pixelsPerUnit,
            y: pixels.y / this.pixelsPerUnit,
        }
    }

    /**
     * 
     * @param {Vector2} worldPoint: point in world space
     */
    WorldPointIsVisible( worldPoint )
    {
        return true;
    }

    /**
     * 
     * @param {*} viewportPoint: point in viewport space
     */
    _PixelIsVisable( viewportPixel )
    {
        return true;
    }

    /**
     * Are any of the supplied points visable
     * @param {Array::Vector2} worldPoints 
     */
    IsVisible( worldPoints )
    {
        return true;
    }

    Clear()
    {
        this.colliders = []
        // Temp. TODO: i would like to draw to a temp canvas then flip it to the main canvas once rendered

        this.ClearRenderer();
    }

    /**
     * Clears the renderer if present
     */
    ClearRenderer()
    {
        if ( this.renderer == null )
            return;

        this.renderer.Clear();

    }

 }