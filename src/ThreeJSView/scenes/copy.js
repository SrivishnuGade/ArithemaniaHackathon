// src/scenes/mainScene.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { initFog } from '../environment/fog.js';
import { initLighting } from '../environment/lighting.js';
import { initGround } from '../environment/ground.js';
import { initSky } from '../environment/sky.js';

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { Prey } from '../entities/Prey';
import { Predator } from '../entities/Predator';



const scene = new THREE.Scene();
initFog(scene);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
camera.position.set(30, 75, 350);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.id = "myCanvas";
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;
controls.enableDamping = true;
controls.dampingFactor = 0.1;

const clock = new THREE.Clock();

initLighting(scene);
initGround(scene);
initSky(scene);

const clouds = [];
function createFluffyCloud() {
    const cloudGroup = new THREE.Group();
    
    const particleMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
    });

    // Adjusted geometry to make particles slightly larger and smoother
    const particleGeometry = new THREE.SphereGeometry(10, 16, 16); // Larger spheres for fluffier particles

    // Create multiple particles to form a fluffy cloud
    for (let i = 0; i < 150; i++) { // Reduced particle count for performance, but larger particles
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);

        // Randomly position each particle to form a spread-out, fluffy cloud shape
        particle.position.set(
            (Math.random() - 0.5) * 80, // x position, wider spread
            (Math.random() - 0.5) * 20, // y position, less vertical spread
            (Math.random() - 0.5) * 80  // z position, wider spread
        );

        // Randomize size slightly for a more natural look
        particle.scale.setScalar(Math.random() * 0.8 + 0.6);
        cloudGroup.add(particle);
    }

    // Set the overall position of the cloud cluster higher in the scene
    cloudGroup.position.set(
        Math.random() * 800 - 400, // x position within -400 to 400
        150 + Math.random() * 100,   // height above ground for a natural cloud level
        Math.random() * 800 - 400  // z position within -400 to 400
    );

    return cloudGroup;
}

// Add multiple fluffy clouds to the scene
for (let i = 0; i < 10; i++) {
    const cloud = createFluffyCloud();
    clouds.push(cloud);
    scene.add(cloud);
}

let tigerMixer;
let deerMixer;
let tiger;
let deer;

// Load the tiger model and its animations
const fbxLoader = new FBXLoader();
fbxLoader.load(
    '/assets/tiger/source/tiger_run.fbx',
    (fbx) => {
        tiger = fbx;
        

        
        // Setup animation mixer
        tigerMixer = new THREE.AnimationMixer(tiger);
        
        // Play all animations found in the FBX
        const animations = tiger.animations;
        if (animations && animations.length) {
            const action = tigerMixer.clipAction(animations[0]);
            action.play();
        }
        
        // Load textures
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('/assets/tiger/textures/FbxTemp_0001.png');
        // const texture = textureLoader.load('/assets/tiger/textures/Tiger.png');
        
        // Apply texture to all meshes
        tiger.traverse((child) => {
            if (child.isMesh) {
                child.material.map = texture;
                child.castShadow = true;
                child.receiveShadow = false;
            }
        });
        tiger.scale.set(0.1, 0.1, 0.1);  // Set scale for all axes explicitly
        tiger.position.set(20, 0, -10);
        tiger.rotation.y = Math.PI;  
        tiger.updateMatrix();  // Force matrix update
        tiger.updateMatrixWorld(true);  // Update world matrix
        // Rotate the tiger to face the camera
        console.log(tiger.rotation.y);
        scene.add(tiger);
    },
    (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total) * 100 + '%');
    },
    (error) => {
        console.error('Error loading tiger:', error);
    }
);

fbxLoader.load(
    '/assets/deer/source/deer.fbx',
    (fbx) => {
        deer = fbx;
        
        // Scale and position the deer
        
        
        // Setup animation mixer
        deerMixer = new THREE.AnimationMixer(deer);
        
        // Play all animations found in the FBX
        const animations = deer.animations;
        if (animations && animations.length) {
            const action = deerMixer.clipAction(animations[3]);
            action.play();
        }
        
        // Load textures
        const textureLoader = new THREE.TextureLoader();
        // const texture = textureLoader.load('/assets/tiger/textures/FbxTemp_0001.png');
        const texture = textureLoader.load('/assets/deer/textures/Antelope_Diffuse.png');
        
        const lightsToRemove = [];
        deer.traverse((child) => {
            if (child.isLight) {
                lightsToRemove.push(child);
            }
        });
        
        // Then remove them safely
        lightsToRemove.forEach(light => {
            if (light.parent) {
                light.parent.remove(light);
            }
        });

        // Apply texture to all meshes
        deer.traverse((child) => {
            if (child.isMesh) {
                child.material.map = texture;
                child.castShadow = true;
                child.receiveShadow = false;
            }
        });
        
        deer.scale.setScalar(0.1);
        deer.position.set(0, 0, 20);

        scene.add(deer);
    },
    (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total) * 100 + '%');
    },
    (error) => {
        console.error('Error loading deer:', error);
    }
);





function animate() {
    const delta = clock.getDelta();
    
    // Update cloud positions
    clouds.forEach(cloud => {
        cloud.position.x += 0.1;
        if (cloud.position.x > 500) cloud.position.x = -500;
    });

    // Update both animations independently
    if (tigerMixer) tigerMixer.update(delta);
    if (deerMixer) deerMixer.update(delta);

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}


animate();
