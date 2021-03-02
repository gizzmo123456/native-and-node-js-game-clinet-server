/**
 * Collection of methods to draw to a html canvas
 * 
 * NOTE:
 * Im not 100% sure how to handle different draw methods atm
 * and how the renderers, viewport and mesh all interact.
 * This is by no means a long term solution. tho could be good 
 * enough for this project.
 * 
 */
export class CanvasRenderer {

    static LoadedTextures = {};   // key: image url, value: image (null if loading or error)

    /**
     * Loads an image into the canvas renderers Texture catch.
     * @param {*} url 
     */
    static LoadTexture( url )
    {
        // make sure the image is not loaded or loading...
        if ( url in CanvasRenderer.LoadTexture )
        {
            console.log( "Unable to load image. Image url already in catch" );
            return;
        }

        var image = new Image();
        image.src = url;

        CanvasRenderer.LoadedTextures[ url ] = image;

    }

    /**
     * Gets an image from the Texture Catch.
     * Trigger the image to load if not already
     * @param {*} url 
     * @returns image or null if not loaded.
     */
    static GetTexture( url )
    {
        if ( !( url in CanvasRenderer.LoadedTextures ) )
        {
            CanvasRenderer.LoadTexture( url );
            return null;
        }

        if ( CanvasRenderer.LoadedTextures[ url ].complete )
            return CanvasRenderer.LoadedTextures[ url ];
        else
            return null;

    }

    constructor( htmlCanvas )
    {
        this.viewport = null;           // What can be viewed
        this.viewportMatrix = null

        this.htmlCanvas = htmlCanvas
        this.canvasCtx = htmlCanvas.getContext("2d");     

        this.matrixSaved = false;

        this.__viewPortoffset = {
            x: 0,
            y: 0
        }

        

        this.__background = {

        }

    }

    SetViewport( viewport )
    {
        
        // Center the render onto the viewport
        this.__viewPortoffset.x = viewport.size.x / 2.0 // If we using a matrix do we even need to do this ??
        this.__viewPortoffset.y = viewport.size.y / 2.0 // ??

        this.viewport = viewport
        this.viewportMatrix = viewport.matrix.matrix;
        
        this.htmlCanvas.width = viewport.size.x
        this.htmlCanvas.height = viewport.size.y

    }

    SetBackground( backgroundOptions )
    {
        console.log("background set");
        console.log( backgroundOptions );

        this.__background = backgroundOptions;

        // if a background image is supplied pre-load it
        if ( "image" in backgroundOptions )
        {
            CanvasRenderer.LoadTexture( backgroundOptions["image"].src )
        }

    }
    
    /**
     * Clears the viewport and resets the trasform back to default
     */
    Clear()
    {

        // return the viewport to the identity matrix
        // So we can clear the viewport in px
        this.canvasCtx.setTransform(1, 0, 0, 1, 0, 0)
        
        // Clear the render.
        if ( "color" in this.__background )
        {   // set the background color
            this.canvasCtx.beginPath();
            this.canvasCtx.fillStyle = this.__background.color;
            this.canvasCtx.rect( 0, 0, this.viewport.size.x, this.viewport.size.y );
            this.canvasCtx.fill();
        }
        else
        {
            this.canvasCtx.clearRect( 0, 0, this.viewport.size.x, this.viewport.size.y );
        }

        
            // Apply the viewport and camera matrix from here everything must be defined in units
            let camMatrix = this.viewport.cameraMatrix.matrix;

            this.canvasCtx.transform( this.viewportMatrix[0][0], this.viewportMatrix[1][0], 
                                      this.viewportMatrix[0][1], this.viewportMatrix[1][1], 
                                      this.viewportMatrix[0][2], this.viewportMatrix[1][2] );

            // the position of the camera needs to be set into the img,
            // otherwise the background rotates around 0, 0 rather than 
            // cameras pivit. However cam rotation sould not be used at the
            // current time, since i cant get the objects and background to 
            // rotate correctly together.
            this.canvasCtx.transform( camMatrix[0][0], camMatrix[1][0], 
                                      camMatrix[0][1], camMatrix[1][1], 
                                      -camMatrix[0][2],-camMatrix[1][2]);

        if ( "image" in this.__background )
        {
            let imgScale = {x: 1, y: 1 };
            if ( "scale" in this.__background.image )
                imgScale = this.__background.image.scale;

            // Apply the background image to the canvas in world space
            let img = CanvasRenderer.GetTexture( this.__background.image.src );

            if ( img )
            {
                this.canvasCtx.scale( imgScale.x, imgScale.y );
                this.canvasCtx.drawImage( img, 
                                          0,/*/-camMatrix[0][2],// * this.viewport.pixelsPerUnit, */
                                          0,/*/-camMatrix[1][2],// * this.viewport.pixelsPerUnit, */
                                          img.width / this.viewport.pixelsPerUnit, 
                                          img.height / this.viewport.pixelsPerUnit );
                this.canvasCtx.scale( 1, 1 );
            }

        }

        // Return the transform matrix to identy since the viewport does most of the transforming
        this.canvasCtx.setTransform(1, 0, 0, 1, 0, 0)

    }

    // TODO: REMOVE?
    DrawRect( rect, options={} )
    {

        var opts = {
            borderWidth: 1,
            borderColour: "#000000",
            fillColor: "#000000",
            ... options
        }

        this.canvasCtx.beginPath();
        this.canvasCtx.fillStyle = opts.fillColor;
        this.canvasCtx.rect( rect.xMin, rect.yMin, rect.xMax, rect.yMax );
        this.canvasCtx.fill();

        //TODO: Border

    }

    /**
     * 
     * @param {Vector2} points: in local space
     * @param {Matrix3x3} matrix:  Maxtrix of transfrom
     * @param {*} options: renderer options
     */
    DrawPolly( points, options={} )
    {      

        if ( points.length < 3 )
        {
            console.log("Renderer::DrawPolly; Not enough points to draw polly!");
            return;
        }

        var opts = {
            borderWidth: 0,
            borderColor: "#000000",
            fill: true,
            fillColor: "#000000",
            ... options             // this is slow
        }

        this.canvasCtx.beginPath();

        // these three are slow too
        this.canvasCtx.lineWidth = opts.borderWidth;
        this.canvasCtx.strokeStyle = opts.borderColor;
        this.canvasCtx.fillStyle = opts.fillColor;

        var point = points[0] ;//this.ApplyOffset( points[0] )
        this.canvasCtx.moveTo( point.x, point.y );

        for ( var i = 1; i < points.length; i++ )
        {
            point = points[i];//this.ApplyOffset(points[i]);
            this.canvasCtx.lineTo( point.x, point.y );
        }

        this.canvasCtx.closePath();

        if ( opts.borderWidth > 0 )
        {
            this.canvasCtx.stroke();
        }

        if ( opts.fill )
        {
            this.canvasCtx.fill();       
        }      

        //this.canvasCtx.restore();

    }

    /**
     * Draw a line (with multiply points)
     * @param {Vector2} startPoint 
     * @param {Array Vector2} points 
     * @param {Hex color} color 
     */
    DrawLine( startPoint, points, color="#000000", width=1 )
    {
        this.canvasCtx.beginPath();

        // set the line color and width
        this.canvasCtx.strokeStyle = color;
        this.canvasCtx.lineWidth = width;

        // move to the start point and traling points, 
        // appling the viewport offset
        this.canvasCtx.moveTo( startPoint.x, startPoint.y );

        points.forEach( point => {
            this.canvasCtx.lineTo( point.x, point.y );
        } );

        this.canvasCtx.stroke();
    }

    // IMPLERMENTED FOR DEBUGING ONLY.
    DrawCircle( position, radius, fill=false )
    {

        this.canvasCtx.beginPath();
        this.canvasCtx.strokeStyle = "white";
        this.canvasCtx.lineWidth = 1;
        this.canvasCtx.arc( position.x, position.y, radius, 0, 2 * Math.PI );
        this.canvasCtx.stroke();

        if (fill)
        {
            this.canvasCtx.fillStyle = "white";
            this.canvasCtx.fill();
        }


    }

    /**OBSOLETE -> TODO: REMOVE */
    ApplyOffset( point )
    {
        return {
            x: point.x + this.__viewPortoffset.x,
            y: point.y + this.__viewPortoffset.y
        }
    }

}