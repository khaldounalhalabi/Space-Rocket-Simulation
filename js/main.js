import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js";
import {GLTFLoader} from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/loaders/GLTFLoader.js";
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js';
import {DRACOLoader} from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/loaders/DRACOLoader.js'

let scene = new THREE.Scene();
let loadedModel;
let rocketMass = 0.0005;
let fuelMass = 0.00005;
let mass = fuelMass + rocketMass; // the whole mass
let deltaMass = 0.0001; //the change of mass
let ve = 0.009; // thrust speed
let dt = 0.0001; //time step
let k = 0.0015; //shape coefficient
let rho = 0.0001; //air density
let s = 0.0003; //the square of the roof that get affect by air resistance
let g = 9.8; //the acceleration of gravity
let CL = 10; //lift coefficient
let G = 1; //gravity coefficient
let theta = Math.PI / 2; //the angle of the rocket jet
let IDelta = 5; //moment inertia of the rocket
let earthMass = 5;

let position = new THREE.Vector3(0, 0, 0); // position vector
let velocity = new THREE.Vector3(0, 0, 0); // velocity vector
let angularVelocity = new THREE.Vector3(0, 0, 0); // angular velocity vector
let acceleration = new THREE.Vector3(0, 0, 0); // acceleration vector
let angularAcceleration = new THREE.Vector3(0, 0, 0); //angular acceleration vector

let fallingVelocity = new THREE.Vector3(0, 0, 0); // falling velocity
let fallingAcceleration = new THREE.Vector3(0, 0, 0); // falling acceleration

// thrust force declaration
let thrustForce = new THREE.Vector3(0, 1, 0);
thrustForce.normalize();
thrustForce.setLength(ve * (deltaMass / dt));

//lift force declaration
let liftForce = new THREE.Vector3(1, 0, 0);
liftForce.normalize();
liftForce.setLength(0.5 * s * rho * CL);
liftForce.multiply(velocity);
liftForce.multiply(velocity);


/* gravitational force */
let center = new THREE.Vector3(0, -100, 0);
let gravityForce = new THREE.Vector3(0, -1, 0);
let distanceSq = gravityForce.distanceToSquared(center);
gravityForce.setLength((G * earthMass * mass) / distanceSq);


//air resistance force declaration
let airResistanceForce = new THREE.Vector3(0, -1, 0);
airResistanceForce.normalize();
airResistanceForce.setLength(0.5 * k * rho * s);
airResistanceForce.multiply(velocity);
airResistanceForce.multiply(velocity);


//falling air resistance force declaration
let fallingAirResistanceForce = new THREE.Vector3(0, 1, 0);
fallingAirResistanceForce.normalize();
fallingAirResistanceForce.setLength(0.5 * k * rho * s);
fallingAirResistanceForce.multiply(fallingVelocity);
fallingAirResistanceForce.multiply(fallingVelocity);


//Weight Force declaration
let weight = new THREE.Vector3(0, -1, 0);
weight.normalize();
weight.setLength(mass * g);


// thrust Force Moment Declaration
let thrustMoment = new THREE.Vector3(0, 0, 0);
thrustMoment.normalize();
let jetSpanRadius = new THREE.Vector3(100, 0, 1);
thrustMoment.crossVectors(thrustForce, jetSpanRadius);
thrustMoment.multiplyScalar(theta);

function applyForce(force) {
    let f = new THREE.Vector3;
    f.copy(force);
    f = f.divideScalar(mass);
    acceleration.add(f);
    acceleration.multiplyScalar(Math.pow(1.5, -1));
}

function applyForceFalling(force) {
    let f = new THREE.Vector3
    f = f.copy(force);
    fallingAcceleration.add(f);
}

function applyMoment(Moment) {
    let M = new THREE.Vector3;
    M.copy(Moment);
    M = M.divideScalar(IDelta);
    angularAcceleration.add(M);
}

function update() {
    applyForce(thrustForce);
    applyForce(weight);
    applyForce(airResistanceForce);
    applyForce(liftForce);
    applyForce(gravityForce);
    velocity.add(acceleration);
    angularVelocity.add(angularAcceleration);
    position.add(velocity);
    position.add(angularVelocity);
}

function updateWithMoment() {
    applyForce(thrustForce);
    applyForce(weight);
    applyForce(airResistanceForce);
    applyForce(liftForce);
    applyForce(gravityForce);
    applyMoment(thrustMoment);
    velocity.add(acceleration);
    angularVelocity.add(angularAcceleration);
    position.add(velocity);
    position.add(angularVelocity);
}

function updateFalling() {
    applyForceFalling(weight);
    applyForceFalling(fallingAirResistanceForce);
    fallingVelocity.add(fallingAcceleration);
    fallingVelocity.multiplyScalar(1.01);
    position.add(fallingVelocity);
}


function init() {
    /*creating a perspectiveCamera*/
    let camera = createPerspectiveCamera();

    /*creating light*/
    const light = new THREE.AmbientLight(0x404040, 5); // soft white light
    createRocket3();
    createEarth();
    createPlane(0, 0, 0);

    /*adding objects to the Scene*/
    scene.add(light);
    let renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("webgl").appendChild(renderer.domElement);
    let controls = new OrbitControls(camera, renderer.domElement);
    controls.target = new THREE.Vector3(10, -450, -200);
    let radius = 500;
    let height = 1000;
    let dct = new THREE.Vector3().copy(controls.target).sub(camera.position);
    let dxz = new THREE.Vector3(dct.x, 0, dct.z);
    let len = dxz.length();
    if (len > radius) {
        dct.multiplyScalar(radius / len);
    }
    camera.position.copy(controls.target).sub(dct); //Clamp camera to cylinder radius
    dct.copy(controls.target).sub(camera.position);
    if ((dct.y - height) > 0) {
        dct.multiplyScalar(height / dct.y);
        camera.position.copy(controls.target).sub(dct); //Clamp to top of cylinder
    }
    animate(renderer, scene, camera, controls);
}


/*Creating an animating scene*/

let move = 0;
let y;
let i = 0;

function updateCameraAndRocketPosition(camera) {
    loadedModel.scene.position.x = position.x;
    loadedModel.scene.position.y = position.y;
    loadedModel.scene.position.z = position.z;
    camera.lookAt(position);
    camera.position.y = position.y - 200;
    camera.position.z = position.z + 100;
    camera.position.x = position.x - 10000;
}

function animate(renderer, scene, camera, controls) {
    renderer.render(scene, camera);
    controls.update();


    if (loadedModel) {
        document.addEventListener('keydown', function (event) {
            if (event.code === 'Enter') {
                move = 1;
            } else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
                move = 0;
            }
        });

        if (move === 1) {

            i++;
            y = loadedModel.scene.position.y;
            if (y < 0) {
                loadedModel.scene.position.y = 0;
            } else if (y >= 600 && fuelMass > 0) {
                updateWithMoment();
                loadedModel.scene.position.x = position.x;
                loadedModel.scene.position.y = position.y;
                loadedModel.scene.position.z = position.z;
                loadedModel.scene.lookAt(angularAcceleration);
                loadedModel.scene.rotateX(-Math.PI / 2);
                acceleration.multiplyScalar(0);
                angularAcceleration.multiplyScalar(0);
                camera.lookAt(position);
                camera.position.y = position.y - 200;
                camera.position.z = position.z + 100;
                camera.position.x = position.x - 10000;
                if (i === 59) {
                    fuelMass = fuelMass - 0.00001;
                    i = 0;
                }
            } else if (fuelMass > 0) {

                update();
                updateCameraAndRocketPosition(camera);
                acceleration.multiplyScalar(0);
                angularAcceleration.multiplyScalar(0);
                if (i === 59) {
                    fuelMass = fuelMass - 0.00001;
                    console.log('fuelMass', fuelMass);
                    i = 0;
                }

            } else if (fuelMass <= 0 && position.y > 0) {

                updateFalling();
                console.log('fall acceleration', fallingAcceleration.y);
                updateCameraAndRocketPosition(camera);
                loadedModel.scene.lookAt(fallingAcceleration);
                loadedModel.scene.rotateX(-Math.PI / 2);
                fallingAcceleration.multiplyScalar(0);
            }
        }

        if (move === 0) {
            loadedModel.scene.position.y = 0;
            loadedModel.scene.position.z = 0;
            loadedModel.scene.position.x = 0;
            position.multiplyScalar(0);
            velocity.multiplyScalar(0);
            acceleration.multiplyScalar(0);
            angularAcceleration.multiplyScalar(0);
            angularVelocity.multiplyScalar(0);
            loadedModel.scene.lookAt(0, 0, 0);
            camera.position.y = position.y + 150;
            camera.position.z = position.z + 1000;

        }
    }
    requestAnimationFrame(function () {
        animate(renderer, scene, camera, controls);
    });
}

function createRocket3() {
    const dracoLoader = new DRACOLoader();
    const RocketLoader = (new GLTFLoader()).setPath('models/rocket/rocket3/');
    RocketLoader.setDRACOLoader(dracoLoader);
    RocketLoader.load('MeteorII V6.gltf', function (gltf) {
        loadedModel = gltf;
        gltf.scene.position.x = 0;
        gltf.scene.position.y = -100;
        gltf.scene.position.z = 0;
        gltf.scene.scale.x = 100;
        gltf.scene.scale.y = 100;
        gltf.scene.scale.z = 100;
        scene.add(gltf.scene);
    });
}

function createPerspectiveCamera() {
    return new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000000);
}


function createEarth() {
    const geometry = new THREE.SphereGeometry(100000, 64, 32);
    const textureLoader = new THREE.TextureLoader();
    const material = new THREE.MeshBasicMaterial({
        map: textureLoader.load('./textures/Sky.jpg'),
        side: THREE.DoubleSide
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
}

function createPlane(x, y, z) {
    const geometry = new THREE.CircleGeometry(100000, 32);
    const textureLoader = new THREE.TextureLoader();
    const down = new THREE.MeshBasicMaterial({map: textureLoader.load('./textures/grass.jpg'), side: THREE.DoubleSide});
    down.wrapS = THREE.RepeatWrapping;
    down.wrapT = THREE.RepeatWrapping;
    const circle = new THREE.Mesh(geometry, down);
    circle.rotation.x = Math.PI / 2;
    circle.position.x = x;
    circle.position.y = y;
    circle.position.z = z;
    scene.add(circle);
}

init();