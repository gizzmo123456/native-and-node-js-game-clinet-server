export class Vector2
{
    static Distance( v2_0, v2_1 )
    {
        return Math.sqrt( Math.pow( v2_0.x - v2_1.x, 2) + Math.pow( v2_0.y - v2_1.y, 2 ) );
    }

    static Magnitude( v2 )
    {
        return Math.sqrt( ( v2.x * v2.x ) + (v2.y * v2.y) );
    }

    static Nomalized( v2 )
    {
        let mag = this.Magnitude( v2 );
        return {
            x: v2.x / mag,
            y: v2.y / mag
        }
    }

    static Dot(v2a, v2b)
    {
        return v2a.x * v2b.x + v2a.y * v2b.y;
        
    }

}