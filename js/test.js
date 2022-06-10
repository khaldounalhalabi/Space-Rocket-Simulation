export class Rocket{
  static  rocketMass ; //instantaneous mass
  static  ve ; //rocket exhaust velocity
  static  dt  = 0.01 ;
  static  thurstForce //= ve * (rocketMass/dt) ;   //instantaneous force
  static  k ; //fixed rocket shape
  static  rho ; //air density
  static  s ; //virtual surface area
  static  airResistanceForce //= 0.5 * k * rho * s * (v * v) ; //air air Resistance Force
  static  g ; //gravity acceleration
  static  w //= rocketMass * g ; // wight force
  static  Forces //= thurstForce - w - airResistanceForce ;
  static  acceleration  //= Forces/rocketMass ;
  static  v ; //velocity of the rocket
}

let spaceXRocket = new Rocket ;

spaceXRocket.thurstForce = spaceXRocket.ve * (spaceXRocket.rocketMass / spaceXRocket.dt) ;
spaceXRocket.airResistanceForce = 0.5 * spaceXRocket.k * spaceXRocket.rho * spaceXRocket.s * (spaceXRocket.v * spaceXRocket.v) ;
spaceXRocket.w = spaceXRocket.rocketMass * spaceXRocket.g ;
spaceXRocket.Forces = spaceXRocket.thurstForce - spaceXRocket.w - spaceXRocket.airResistanceForce ;
spaceXRocket.acceleration = spaceXRocket.Forces / spaceXRocket.rocketMass ;

var rocketPosition = [] ;

for (var i = 0 ; i < 1000000 ; i++) {
  spaceXRocket.v = spaceXRocket.v + (spaceXRocket.acceleration * spaceXRocket.dt) ;
  rocketPosition[i] = spaceXRocket.v * spaceXRocket.dt ;
}
