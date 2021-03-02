
const Identity = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
]

const DegToRad = Math.PI / 180;

export class Matrix3x3
{

    constructor ()
    {
        this.matrix = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ];

        this.__sin = 0;
        this.__cos = 0;

        this.__scale = {x: 1, y: 1}

        this.SetRotation(0);    // set sin and cos

    }

    static GetMatrixFromTransform( transform )
    {
        let matrix = new Matrix3x3();
        matrix.SetFromTransform( transform )

        return matrix;
    }

    static GetMatrixFromTransformReleventTo( transform, releventToPosition )
    {
        /**
         * x: worldPosition.x - pos.x,
         * y: pos.y - worldPosition.y 
         * 
         */
        let releventPosition = {
            x: transform.position.x - releventToPosition.x,
            y: transform.position.y - releventToPosition.y        // this was the other way in VP
        }

        let matrix = new Matrix3x3();
        matrix.SetPosition( releventPosition.x, releventPosition.y );
        matrix.SetRotation( transform.rotation );
        matrix.SetScale( transform.scale.x, transform.scale.y );

        return matrix;
    }

    SetFromTransform( transform )
    {

        this.SetPosition( transform.position.x, transform.position.y )

        this.__sin = Math.sin( transform.rotation * DegToRad);
        this.__cos = Math.cos( transform.rotation * DegToRad);

        this.__scale = { x: transform.scale.x, y: transform.scale.y }

        this.__UpdateMatrix();

    }

    SetPosition( x, y )
    {
        this.matrix[0][2] = x;
        this.matrix[1][2] = y;
    }

    SetRotation( rot )
    {
        this.__sin = Math.sin( rot * DegToRad);
        this.__cos = Math.cos( rot * DegToRad);

        this.__UpdateMatrix();

    }

    SetScale( x, y )
    {

        this.__scale.x = x;
        this.__scale.y = y;

        this.__UpdateMatrix();

    }

    SetToIdentity()
    {
        this.matrix = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ]
    }

    GetInverse()
    {
        let determinant = this.matrix[0][0] * this.matrix[1][1] - -this.matrix[0][1] * -this.matrix[1][0];

        if (determinant == 0)
        {
            console.log( "No invers matrix. Determinant is 0" );
            return this;
        }

        determinant = 1 / determinant;

        let mat = new Matrix3x3();
        mat.matrix[0][0] = this.matrix[1][1];// * determinant;
        mat.matrix[1][1] = this.matrix[0][0];// * determinant

        mat.matrix[0][1] = -this.matrix[0][1];// * determinant;
        mat.matrix[1][0] = -this.matrix[1][0];// * determinant;

        mat.matrix[0][2] = -this.matrix[0][2];// * determinant;
        mat.matrix[1][2] = -this.matrix[1][2];// * determinant;

        return mat;
    }

    /**
     * Updates the matrixes rotation and scale
     */
    __UpdateMatrix()
    {
        
        this.matrix[0][0] = this.__cos * this.__scale.x;
        this.matrix[0][1] = this.__sin * this.__scale.y;

        this.matrix[1][0] = -this.__sin * this.__scale.x;
        this.matrix[1][1] =  this.__cos * this.__scale.y;
    }

    // NOTE: this is how it is with canvas
    Multiply( x, y )
    {

        return {
            x: this.matrix[0][0] * x + this.matrix[0][1] * y + this.matrix[0][2],
            y: this.matrix[1][0] * x + this.matrix[1][1] * y + this.matrix[1][2],
            w: 1
        }
    }

    MultiplyInverse( x, y )
    {

        let inverseMatrix = this.GetInverse();

        return inverseMatrix.Multiply( x, y );
    }

}