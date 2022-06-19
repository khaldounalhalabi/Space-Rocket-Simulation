import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/loaders/DRACOLoader.js'

var scene = new THREE.Scene();
var loadedModel;
var rocketMass = 0.0005;
var fuelMass = 0.00003;
var mass = fuelMass + rocketMass;
var deltaMass = 0.0001;
var ve = 0.009;
var dt = 0.0001;
var k = 0.0015;
var rho = 0.0001;
var s = 0.0003;
var g = 9.8;
var CL = 10; //lift coifficint
var G = 1; //gravity const
var theta = Math.PI / 3;
var IDelta = 5;
var earthMass = 5; //5.972 * Math.pow(10, 24);
var rocket = 2;

var position = new THREE.Vector3(0, 0, 0);
var velocity = new THREE.Vector3(0, 0, 0);
var angularVelocity = new THREE.Vector3(0, 0, 0);
var acceleration = new THREE.Vector3(0, 0, 0);
var angularAcceleration = new THREE.Vector3(0, 0, 0);


var fallingVelocity = new THREE.Vector3(0, 0, 0);
var fallingAcceleration = new THREE.Vector3(0, 0, 0);

// thrust force decleration
var thrustForce = new THREE.Vector3(0, 1, 0);
thrustForce.normalize();
thrustForce.setLength(ve * (deltaMass / dt));

//lift force decleration
var liftForce = new THREE.Vector3(1, 0, 0);
liftForce.normalize();
liftForce.setLength(0.5 * s * rho * CL);
liftForce.multiply(velocity);
liftForce.multiply(velocity);


/* gravitational force */
var center = new THREE.Vector3(0, -100, 0);
var gravityForce = new THREE.Vector3(0, -1, 0);
var distanceSq = gravityForce.distanceToSquared(center);
gravityForce.setLength((G * earthMass * mass) / distanceSq);




//air resistance force decleration
var airResistanceForce = new THREE.Vector3(0, -1, 0);
airResistanceForce.normalize();
airResistanceForce.setLength(0.5 * k * rho * s);
airResistanceForce.multiply(velocity);
airResistanceForce.multiply(velocity);



//falling air resistance force decleration
var fallingAirResistanceForce = new THREE.Vector3(0, 1, 0);
fallingAirResistanceForce.normalize();
fallingAirResistanceForce.setLength(0.5 * k * rho * s);
fallingAirResistanceForce.multiply(fallingVelocity);
fallingAirResistanceForce.multiply(fallingVelocity);


//Weight Force decleration
var weight = new THREE.Vector3(0, -1, 0);
weight.normalize();
weight.setLength(mass * g);


// thrust Force Moment Decleration
var thrustMoment = new THREE.Vector3(0, 0, 0);
thrustMoment.normalize();
var jetSpanRadius = new THREE.Vector3(100, 0, 1);
thrustMoment.crossVectors(thrustForce, jetSpanRadius);
thrustMoment.multiplyScalar(theta);


function applyForce(force) {
    var f = new THREE.Vector3;
    f.copy(force);
    f = f.divideScalar(mass);
    acceleration.add(f);
    acceleration.multiplyScalar(Math.pow(1.5, -1));
}

function applyForceFalling(force) {
    var f = new THREE.Vector3
    f = f.copy(force);
    fallingAcceleration.add(f);
}

function applyMoment(Moment) {
    var M = new THREE.Vector3;
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
    /*creating a new variables value control panel*/
    var gui = new dat.GUI();
    /*creating a perspectiveCamera*/
    var camera = createPerspectivCamera();

    /*creating light*/
    const light = new THREE.AmbientLight(0x404040, 5); // soft white light

    switch (rocket) {
        case 1:
            /*adding models*/
            createRocket1();
            /*create world */
            createEarth();
            createPlane(0, -200, 0);
            break;
        case 2:
            createRocket3();
            createEarth();
            createPlane(0, 0, 0);
    }

    /*adding objects to the Scene*/
    scene.add(light);
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("webgl").appendChild(renderer.domElement);
    var controls = new OrbitControls(camera, renderer.domElement);
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

var move = 0;
var y;
var i = 0;

function animate(renderer, scene, camera, controls) {
    renderer.render(scene, camera);
    controls.update();


    if (loadedModel) {
        document.addEventListener('keydown', function(event) {
            if (event.keyCode == 13) {
                move = 1;
            } else if (event.keyCode == 16) {
                move = 0;
            }
        });

        if (move == 1) {

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
                camera.position.y = position.y - 100;
                camera.position.z = position.z + 1000;
                if (i == 59) {
                    fuelMass = fuelMass - 0.00001;
                    i = 0;
                }
            } else if (fuelMass > 0) {

                update();
                loadedModel.scene.position.x = position.x;
                loadedModel.scene.position.y = position.y;
                loadedModel.scene.position.z = position.z;
                camera.lookAt(position);
                camera.position.y = position.y - 100;
                camera.position.z = position.z + 1000;
                acceleration.multiplyScalar(0);
                angularAcceleration.multiplyScalar(0);
                if (i == 59) {
                    fuelMass = fuelMass - 0.00001;
                    console.log('fuelMass', fuelMass);
                    i = 0;
                }

            } else if (fuelMass <= 0 && position.y > 0) {

                updateFalling();
                console.log('fall acceleration', fallingAcceleration.y);
                loadedModel.scene.position.x = position.x;
                loadedModel.scene.position.y = position.y;
                loadedModel.scene.position.z = position.z;
                camera.lookAt(position);
                camera.position.y = position.y - 100;
                camera.position.z = position.z + 1000;
                loadedModel.scene.lookAt(fallingAcceleration);
                loadedModel.scene.rotateX(-Math.PI / 2);
                fallingAcceleration.multiplyScalar(0);
            }
        }

        if (move == 0) {
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
    requestAnimationFrame(function() {
        animate(renderer, scene, camera, controls);
    });
}

function createRocket3() {
    const dracoLoader = new DRACOLoader();
    const RocketLoader = new GLTFLoader().setPath('models/rocket/rocket3/');
    RocketLoader.setDRACOLoader(dracoLoader);
    RocketLoader.load('MeteorII V6.gltf', function(gltf) {
        loadedModel = gltf;
        gltf.scene.position.x = 0;
        gltf.scene.position.y = -100;
        gltf.scene.position.z = 0;
        gltf.scene.scale.x = 100;
        gltf.scene.scale.y = 100;
        gltf.scene.scale.z = 100;
        // gltf.scene.rotateX = -Math.PI / 2;
        scene.add(gltf.scene);
        gltf.asset;
        gltf.scene;
        gltf.scenes;
        gltf.cameras;

    });
}

function createRocket1() {
    const dracoLoader = new DRACOLoader();
    const RocketLoader = new GLTFLoader().setPath('models/rocket/rocket1/');
    RocketLoader.setDRACOLoader(dracoLoader);
    RocketLoader.load('Space Rocket.gltf', function(gltf) {
        loadedModel = gltf;
        gltf.scene.scale.x = 100;
        gltf.scene.scale.y = 100;
        gltf.scene.scale.z = 100;
        scene.add(gltf.scene);
        gltf.asset;
        gltf.scene;
        gltf.scenes;
        gltf.cameras;

    });
}


function createPerspectivCamera() {
    var pcamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000000);
    return pcamera;
}


function createEarth() {
    const geometry = new THREE.SphereGeometry(1000000, 64, 32);
    const material = new THREE.MeshBasicMaterial({ color: 'rgb(135,206,235)', side: THREE.DoubleSide });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
}

function createPlane(x, y, z) {
    const geometry = new THREE.CircleGeometry(10000, 32);
    const textureLoader = new THREE.TextureLoader();
    const down = new THREE.MeshBasicMaterial({ map: textureLoader.load('./textures/grass.jpg'), side: THREE.DoubleSide });
    down.wrapS = THREE.RepeatWrapping;
    down.wrapT = THREE.RepeatWrapping;
    const material = down;
    const circle = new THREE.Mesh(geometry, material);
    circle.rotation.x = Math.PI / 2;
    circle.position.x = x;
    circle.position.y = y;
    circle.position.z = z;
    scene.add(circle);
}
init();