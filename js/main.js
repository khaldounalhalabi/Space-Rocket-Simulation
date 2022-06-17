import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/loaders/DRACOLoader.js'

var scene = new THREE.Scene();
var loadedModel;
var mass = 0.0005;
var ve = 0.001;
var dt = 0.0001;
var k = 0.0015;
var rho = 0.001;
var s = 0.03;
var g = 9.8;
var CL = 10; //lift coifficint   
var G = 1; //gravity const
var theta = Math.PI / 6;
var IDelta = 5;
var earthMass = 5; //5.972 * Math.pow(10, 24);
var position = new THREE.Vector3(0, 0, 0);
var velocity = new THREE.Vector3(0, 0, 0);
var angularVelocity = new THREE.Vector3(0, 0, 0);
var acceleration = new THREE.Vector3(0, 0, 0);
var angularAcceleration = new THREE.Vector3(0, 0, 0);

// thurst force decleration 
var thurstForce = new THREE.Vector3(0, 1, 0);
thurstForce.normalize();
thurstForce.setLength(ve * (mass / dt));

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


//Weight Force decleration
var weight = new THREE.Vector3(0, -1, 0);
weight.normalize();
weight.setLength(mass * g);


// Thurst Force Moment Decleration
var thrustMoment = new THREE.Vector3(0, 0, 0);
thrustMoment.normalize();
var jetSpanRadius = new THREE.Vector3(100, 0, 1);
thrustMoment.crossVectors(thurstForce, jetSpanRadius);


function applyForce(force) {
    var f = new THREE.Vector3;
    f.copy(force);
    f = f.divideScalar(mass);
    acceleration.add(f);
}

function applyMoment(Moment) {
    var M = new THREE.Vector3;
    M.copy(Moment);
    M = M.divideScalar(IDelta);
    angularAcceleration.add(M);
}

function update() {
    applyForce(thurstForce);
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


function init() {
    /*creating a new variables value control panel*/
    var gui = new dat.GUI();
    /*creating a perspectiveCamera*/
    var camera = createPerspectivCamera();
    camera.position.z = -250;
    /*creating light*/
    const light = new THREE.AmbientLight(0x404040, 5); // soft white light
    /*adding models*/
    createRocket(0, 0, 0);
    //
    // createCylinderWorld() ;
    createEarth();
    createPlane();

    /*adding objects to the Scene*/
    scene.add(light);

    // gui.add(this, "ve", 0, 10000);
    // gui.add(this, "k", 0, 10000);
    // gui.add(this, "rho", 0, 10000);
    // gui.add(this, "s", 0, 10000);
    // gui.add(this, "g", 0, 10000);
    // gui.add(this, "mass", 0, 10000);

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
    //controls.maxDistance = 250 ;
    animate(renderer, scene, camera, controls);
}




/*Creating an animating scene*/

var move = 0;


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
            update();
            loadedModel.scene.position.x = position.x;
            loadedModel.scene.position.y = position.y;
            loadedModel.scene.position.z = position.z;
            var holder = new THREE.Vector3;
            holder.copy(position);
            holder.applyAxisAngle(position, Math.PI);
            loadedModel.scene.lookAt(holder);
            acceleration.multiplyScalar(0);
            angularAcceleration.multiplyScalar(0);
            camera.lookAt(position);
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
        }
    }
    requestAnimationFrame(function() {
        animate(renderer, scene, camera, controls);
    });
}

function createRocket(rx, ry, rz) {
    const dracoLoader = new DRACOLoader();
    const RocketLoader = new GLTFLoader().setPath('models/rocket/');
    RocketLoader.setDRACOLoader(dracoLoader);
    RocketLoader.load('scene.gltf', function(gltf) {
        loadedModel = gltf;
        gltf.scene.position.x = rx;
        gltf.scene.position.y = ry;
        gltf.scene.position.z = rz;
        gltf.scene.scale.x = 10;
        gltf.scene.scale.y = 10;
        gltf.scene.scale.z = 10;
        scene.add(gltf.scene);
        gltf.asset;
        gltf.scene;
        gltf.scenes;
        gltf.cameras;

    });
}

function createSkybox() {
    /*loading skybox texture*/
    const textureLoader = new THREE.TextureLoader();
    const front = new THREE.MeshBasicMaterial({ map: textureLoader.load('./textures/sky.jpg'), side: THREE.DoubleSide });
    const back = new THREE.MeshBasicMaterial({ map: textureLoader.load('./textures/sky.jpg'), side: THREE.DoubleSide });
    const up = new THREE.MeshBasicMaterial({ map: textureLoader.load('./textures/sky.jpg'), side: THREE.DoubleSide });
    const down = new THREE.MeshBasicMaterial({ map: textureLoader.load('./textures/grass.jpg'), side: THREE.DoubleSide });
    const right = new THREE.MeshBasicMaterial({ map: textureLoader.load('./textures/sky.jpg'), side: THREE.DoubleSide });
    const left = new THREE.MeshBasicMaterial({ map: textureLoader.load('./textures/sky.jpg'), side: THREE.DoubleSide });
    front.wrapS = THREE.RepeatWrapping;
    front.wrapT = THREE.RepeatWrapping;
    back.wrapS = THREE.RepeatWrapping;
    back.wrapT = THREE.RepeatWrapping;
    up.wrapS = THREE.RepeatWrapping;
    up.wrapT = THREE.RepeatWrapping;
    down.wrapS = THREE.RepeatWrapping;
    down.wrapT = THREE.RepeatWrapping;
    right.wrapS = THREE.RepeatWrapping;
    right.wrapT = THREE.RepeatWrapping;
    left.wrapS = THREE.RepeatWrapping;
    left.wrapT = THREE.RepeatWrapping;
    const materials = [front, back, up, down, right, left];
    const skyboxGeo = new THREE.BoxGeometry(500, 500, 500);
    const skybox = new THREE.Mesh(skyboxGeo, materials);
    //skybox.position.y = 500 ;
    scene.add(skybox);
}

function createPerspectivCamera() {
    var pcamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 50000);
    pcamera.position.x = 0;
    pcamera.position.y = 200;
    pcamera.position.z = 0;

    // pcamera.scale.x = 10;
    // pcamera.scale.y = 10;
    // pcamera.scale.z = 10;

    pcamera.target = new THREE.Vector3(0, -500, 0);
    // pcamera.rotateX(Math.PI/2) ;

    //pcamera.position.set(0,-400,-10) ;
    //pcamera.getWorldDirection(new THREE.Vector3(0 ,-400 , -5)) ; //telling the camera to look at the point (0,0,0)
    return pcamera;
}

function createCylinderWorld() {
    const textureLoader = new THREE.TextureLoader();
    const front = new THREE.MeshBasicMaterial({ map: textureLoader.load('./textures/sky.jpg'), side: THREE.DoubleSide });
    const back = new THREE.MeshBasicMaterial({ map: textureLoader.load('./textures/sun.jpg'), side: THREE.DoubleSide });
    const down = new THREE.MeshBasicMaterial({ map: textureLoader.load('./textures/grass.jpg'), side: THREE.DoubleSide });
    front.wrapS = THREE.RepeatWrapping;
    front.wrapT = THREE.RepeatWrapping;
    back.wrapS = THREE.RepeatWrapping;
    back.wrapT = THREE.RepeatWrapping;
    down.wrapS = THREE.RepeatWrapping;
    down.wrapT = THREE.RepeatWrapping;
    const geometry = new THREE.CylinderGeometry(500, 500, 1000, 100);
    const material = [front, back, down];
    const cylinder = new THREE.Mesh(geometry, material);
    scene.add(cylinder);
}

function createEarth() {
    const geometry = new THREE.SphereGeometry(10000, 64, 32);
    const material = new THREE.MeshBasicMaterial({ color: 'rgb(135,206,235)', side: THREE.DoubleSide });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
}

function createPlane() {
    const geometry = new THREE.CircleGeometry(10000, 32);
    const textureLoader = new THREE.TextureLoader();
    const down = new THREE.MeshBasicMaterial({ map: textureLoader.load('./textures/grass.jpg'), side: THREE.DoubleSide });
    down.wrapS = THREE.RepeatWrapping;
    down.wrapT = THREE.RepeatWrapping;
    const material = down;
    const circle = new THREE.Mesh(geometry, material);
    circle.rotation.x = Math.PI / 2;
    circle.position.x = 0;
    circle.position.y = 0;
    circle.position.z = 0;
    scene.add(circle);
}

init();