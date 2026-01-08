// src/scenes/mainScene.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { initFog } from '../environment/fog.js';
import { initLighting } from '../environment/lighting.js';
import { initGround } from '../environment/ground.js';
import { initSky } from '../environment/sky.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { gsap } from 'gsap';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { readCsvFile } from '../utils/csvReader.js';

export function init(container, reserveName, reserveData, onStatsUpdate) {
    let scene, camera, renderer, controls, clock;
    let clouds = [];
    let tigers = [];
    let deers = [];
    let tigerMixers = [];
    let deerMixers = [];
    let animationId;
    let intervalId;

    let ndvi = [[]];
    let preydensity = [[]];
    let predatordensity = [[]];

    // Initialize Scene
    scene = new THREE.Scene();
    initFog(scene);

    // Initialize Camera
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 5, 5000);
    camera.position.set(30, 75, 350);

    // Initialize Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Initialize Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI / 2;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    clock = new THREE.Clock();

    initLighting(scene);
    initSky(scene);

    // Load Data
    const park = reserveName || "Nagarhole";
    const ndviFile = `${park}_last_ndvi.csv`;
    const preyFile = `${park}_last_prey_density.csv`;
    const predatorFile = `${park}_last_predator_density.csv`;

    Promise.all([
        readCsvFile(ndviFile).catch(err => console.error("Error loading NDVI:", err)),
        readCsvFile(preyFile).catch(err => console.error("Error loading Prey:", err)),
        readCsvFile(predatorFile).catch(err => console.error("Error loading Predator:", err))
    ]).then(([ndviData, preyData, predatorData]) => {
        if (ndviData) {
            ndvi = ndviData;
            initGround(scene, ndvi);
        }
        if (preyData) preydensity = preyData;
        if (predatorData) predatordensity = predatorData;

        // Load Models after data is ready
        loadModels();
    });

    function createFluffyCloud() {
        const cloudGroup = new THREE.Group();
        const particleMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            depthWrite: false,
        });
        const particleGeometry = new THREE.SphereGeometry(10, 16, 16);

        for (let i = 0; i < 150; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(
                (Math.random() - 0.5) * 80,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 80
            );
            particle.scale.setScalar(Math.random() * 0.8 + 0.6);
            cloudGroup.add(particle);
        }

        cloudGroup.position.set(
            Math.random() * 800 - 400,
            150 + Math.random() * 100,
            Math.random() * 800 - 400
        );
        return cloudGroup;
    }

    for (let i = 0; i < 10; i++) {
        const cloud = createFluffyCloud();
        clouds.push(cloud);
        scene.add(cloud);
    }

    function loadModels() {
        const fbxLoader = new FBXLoader();

        // Calculate animal numbers based on reserve data
        // Default to random if data is missing or invalid
        let numtigers, numdeers;

        if (reserveData && typeof reserveData.tigerDensity === 'number') {
            // Scale density to a reasonable number for the scene
            // Density is per 100 sq km. 
            // Let's say we want a base of ~5-15 tigers for a typical reserve
            numtigers = Math.max(2, Math.round(reserveData.tigerDensity * 0.5));

            // Prey density is usually much higher. 
            // We can estimate it based on tiger density or just scale it up.
            // A healthy ratio might be 1 tiger : 50-100 prey, but for visual purposes we'll keep it lower (1:5 to 1:10)
            numdeers = Math.max(10, Math.round(numtigers * 8));
        } else {
            // Fallback to original random logic
            numtigers = Math.random() * 2 + 8;
            numdeers = Math.random() * 5 + 45;
        }

        console.log(`Loading ${numtigers} tigers and ${numdeers} deers for ${reserveName}`);

        // Load Tiger
        fbxLoader.load(
            '/assets/tiger/source/tiger_run.fbx',
            (fbx) => {
                const textureLoader = new THREE.TextureLoader();
                const texture = textureLoader.load('/assets/tiger/textures/FbxTemp_0001.png');

                for (let i = 0; i < numtigers; i++) {
                    const tigerClone = clone(fbx);
                    tigerClone.traverse((child) => {
                        if (child.isMesh) {
                            child.material = child.material.clone();
                            child.material.map = texture;
                            child.castShadow = true;
                            child.receiveShadow = false;
                        }
                    });

                    const mixer = new THREE.AnimationMixer(tigerClone);
                    if (tigerClone.animations && tigerClone.animations.length) {
                        const action = mixer.clipAction(tigerClone.animations[0]);
                        action.play();
                    }
                    tigerMixers.push(mixer);

                    let placed = false;
                    let attempts = 0;
                    while (!placed && attempts < 100) {
                        attempts++;
                        const gridX = Math.floor(Math.random() * predatordensity.length);
                        const gridZ = Math.floor(Math.random() * predatordensity[0].length);
                        const density = predatordensity[gridX] && predatordensity[gridX][gridZ] ? parseFloat(predatordensity[gridX][gridZ]) : 0;

                        if (Math.random() < density || attempts > 90) {
                            const tileSize = 1000 / (predatordensity.length || 1);
                            tigerClone.position.set(
                                -500 + tileSize * (gridX + Math.random()),
                                0,
                                -500 + tileSize * (gridZ + Math.random())
                            );
                            placed = true;
                        }
                    }
                    tigerClone.scale.set(0.1, 0.1, 0.1);
                    scene.add(tigerClone);
                    tigers.push(tigerClone);
                }
            },
            undefined,
            (error) => console.error('Error loading tiger:', error)
        );

        // Load Deer
        fbxLoader.load(
            '/assets/deer/source/deer.fbx',
            (fbx) => {
                const textureLoader = new THREE.TextureLoader();
                const texture = textureLoader.load('/assets/deer/textures/Antelope_Diffuse.png');

                // Remove lights from model
                const lightsToRemove = [];
                fbx.traverse((child) => {
                    if (child.isLight) lightsToRemove.push(child);
                });
                lightsToRemove.forEach(light => light.parent.remove(light));

                for (let i = 0; i < numdeers; i++) {
                    const deerClone = clone(fbx);
                    deerClone.traverse((child) => {
                        if (child.isMesh) {
                            child.material = child.material.clone();
                            child.material.map = texture;
                            child.castShadow = true;
                            child.receiveShadow = false;
                        }
                    });

                    const mixer = new THREE.AnimationMixer(deerClone);
                    if (deerClone.animations && deerClone.animations.length) {
                        const action = mixer.clipAction(deerClone.animations[0]);
                        action.play();
                    }
                    deerMixers.push(mixer);

                    let placed = false;
                    let attempts = 0;
                    while (!placed && attempts < 100) {
                        attempts++;
                        const gridX = Math.floor(Math.random() * preydensity.length);
                        const gridZ = Math.floor(Math.random() * preydensity[0].length);
                        const density = preydensity[gridX] && preydensity[gridX][gridZ] ? parseFloat(preydensity[gridX][gridZ]) : 0;

                        if (Math.random() < density || attempts > 90) {
                            const tileSize = 1000 / (preydensity.length || 1);
                            deerClone.position.set(
                                -500 + tileSize * (gridX + Math.random()),
                                0,
                                -500 + tileSize * (gridZ + Math.random())
                            );
                            placed = true;
                        }
                    }
                    deerClone.scale.set(0.1, 0.1, 0.1);
                    scene.add(deerClone);
                    deers.push(deerClone);
                }
            },
            undefined,
            (error) => console.error('Error loading deer:', error)
        );
    }

    function updateSimulation() {
        // Move deers
        deers.forEach(deer => {
            const dx = (Math.random() - 0.5) * 50;
            const dz = (Math.random() - 0.5) * 50;
            const newX = Math.max(-500, Math.min(500, deer.position.x + dx));
            const newZ = Math.max(-500, Math.min(500, deer.position.z + dz));

            const deltaheading = Math.atan2(newZ - deer.position.z, newX - deer.position.x);

            gsap.to(deer.rotation, {
                y: -deltaheading + Math.PI / 2,
                duration: 0.1,
                ease: "power1.out"
            });
            gsap.to(deer.position, {
                x: newX,
                z: newZ,
                duration: 0.9,
                ease: "power1.out"
            });
        });

        // Move tigers
        tigers.forEach(tiger => {
            let nearestDeer = deers.reduce((closest, current) => {
                const closestDistance = tiger.position.distanceTo(closest.position);
                const currentDistance = tiger.position.distanceTo(current.position);
                return currentDistance < closestDistance ? current : closest;
            }, deers[0]);

            if (nearestDeer) {
                const direction = new THREE.Vector3()
                    .subVectors(nearestDeer.position, tiger.position)
                    .normalize();

                const newX = tiger.position.x + direction.x * 25;
                const newZ = tiger.position.z + direction.z * 25;
                const deltaheading = Math.atan2(newZ - tiger.position.z, newX - tiger.position.x);

                tiger.rotation.z = -deltaheading + Math.PI / 2;
                gsap.to(tiger.position, {
                    x: newX,
                    z: newZ,
                    duration: 1.0,
                    ease: "none"
                });

                const distance = tiger.position.distanceTo(nearestDeer.position);
                if (distance < 20) {
                    const index = deers.indexOf(nearestDeer);
                    if (index !== -1) {
                        // Play death animation if available, otherwise just remove
                        // Simplified for now to avoid complex mixer logic without full context
                        scene.remove(nearestDeer);
                        deers.splice(index, 1);
                        deerMixers.splice(index, 1);
                    }
                }
            }
        });

        // Reproduction
        if (deers.length < 30 && Math.random() < 0.3 && deers.length > 0) {
            const newDeer = deers[0].clone();
            newDeer.position.set(Math.random() * 200 - 100, 0, Math.random() * 200 - 100);
            scene.add(newDeer);
            deers.push(newDeer);

            // Clone mixer logic simplified
            const newMixer = new THREE.AnimationMixer(newDeer);
            if (newDeer.animations && newDeer.animations.length) {
                newMixer.clipAction(newDeer.animations[0]).play();
            }
            deerMixers.push(newMixer);
        }

        if (tigers.length < 10 && Math.random() < 0.05 && tigers.length > 0) {
            const newTiger = tigers[0].clone();
            newTiger.position.set(Math.random() * 800 - 400, 0, Math.random() * 800 - 400);
            scene.add(newTiger);
            tigers.push(newTiger);

            const newMixer = new THREE.AnimationMixer(newTiger);
            if (newTiger.animations && newTiger.animations.length) {
                newMixer.clipAction(newTiger.animations[0]).play();
            }
            tigerMixers.push(newMixer);
        }

        // Starvation
        if (deers.length < 6 && Math.random() < 0.05 && tigers.length > 2) {
            const tigerToRemove = tigers.pop();
            scene.remove(tigerToRemove);
            tigerMixers.pop();
        }

        if (onStatsUpdate) {
            onStatsUpdate({ tigers: tigers.length, deers: deers.length });
        }
    }

    intervalId = setInterval(updateSimulation, 1000);

    function onWindowResize() {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    window.addEventListener('resize', onWindowResize, false);

    function animate() {
        animationId = requestAnimationFrame(animate);
        const delta = clock.getDelta();

        clouds.forEach(cloud => {
            cloud.position.x += 0.1;
            if (cloud.position.x > 500) cloud.position.x = -500;
        });

        tigerMixers.forEach(mixer => mixer.update(delta));
        deerMixers.forEach(mixer => mixer.update(delta));

        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    return () => {
        window.removeEventListener('resize', onWindowResize);
        cancelAnimationFrame(animationId);
        clearInterval(intervalId);

        // Dispose resources
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
        }

        // Optional: Traverse scene and dispose geometries/materials
    };
}
