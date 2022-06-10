export class ff {
    static rocketMass; //instantaneous mass
    static ve; //rocket exhaust velocity
    static dt = 0.01;
    static thurstForce = ve * (rocketMass / dt); //instantaneous force
    static k; //fixed rocket shape
    static rho; //air density
    static s; //virtual surface area

    static airResistanceForce = 0.5 * k * rho * s * (v * v); //air air Resistance Force
    static g; //gravity acceleration
    static w = rocketMass * g; // wight force
    static Forces = thurstForce - w - airResistanceForce;
    static acceleration = Forces / rocketMass;
    static v; //velocity of the rocket
}