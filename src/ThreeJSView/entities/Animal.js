import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

// Base class for both Prey and Predator
export class Animal {
    static modelCache = new Map();
    static textureCache = new Map();
    
    constructor(scene, modelPath, texturePath) {
        this.scene = scene;
        this.modelPath = modelPath;
        this.texturePath = texturePath;
        this.model = null;
        this.mixer = null;
        this.action = null;
        this.heading = new THREE.Vector3(0, 0, 1);
    }

    async load() {
        if (Animal.modelCache.has(this.modelPath)) {
            this.model = Animal.modelCache.get(this.modelPath).clone();
            this.setupModelInstance();
            return;
        }

        return new Promise((resolve, reject) => {
            const loader = new FBXLoader();
            loader.load(
                this.modelPath,
                (fbx) => {
                    Animal.modelCache.set(this.modelPath, fbx);
                    this.model = fbx.clone();
                    this.setupModelInstance();
                    resolve();
                },
                undefined,
                reject
            );
        });
    }

    setupModelInstance() {
        this.mixer = new THREE.AnimationMixer(this.model);
        
        if (!Animal.textureCache.has(this.texturePath)) {
            const texture = new THREE.TextureLoader().load(this.texturePath);
            Animal.textureCache.set(this.texturePath, texture);
        }
        
        const texture = Animal.textureCache.get(this.texturePath);
        
        this.model.traverse((child) => {
            if (child.isMesh) {
                child.material.map = texture;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    addToScene(position = { x: 0, y: 0, z: 0 }, scale = 0.1) {
        this.model.scale.setScalar(scale);
        this.model.position.set(position.x, position.y, position.z);
        this.scene.add(this.model);
    }

    removeFromScene() {
        this.scene.remove(this.model);
        this.mixer.stopAllAction();
    }

    setAnimationSpeed(speed) {
        if (this.action) {
            this.action.timeScale = speed;
        }
    }

    moveTo(newPosition) {
        const currentPos = this.model.position;
        this.heading.subVectors(new THREE.Vector3(newPosition.x, currentPos.y, newPosition.z), currentPos);
        
        if (this.heading.length() > 0.01) {
            this.heading.normalize();
            const angle = Math.atan2(this.heading.x, this.heading.z);
            this.model.rotation.y = angle;
        }
        
        this.model.position.set(newPosition.x, newPosition.y, newPosition.z);
    }

    update(delta) {
        if (this.mixer) {
            this.mixer.update(delta);
        }
    }
}