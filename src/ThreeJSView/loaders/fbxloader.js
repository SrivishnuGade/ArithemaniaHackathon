import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

const prey = [];
const predators = [];

const fbxLoader = new FBXLoader();

export function loadPrey(scene, scale, positionY = 0, counter = 0, l = 0) {
    return new Promise((resolve, reject) => {
        fbxLoader.load('/assets/deer/source/deer.fbx', function (object) {
            object.scale.set(scale, scale, scale);
            object.position.set(-counter, positionY, -(90 + l * 30));
            object.castShadow = true;
            object.receiveShadow = false;

            if (!prey) {
                prey = [];
            }

            prey.push(object);

            object.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = false;
                    child.renderOrder = 1;
                    if (child.material) {
                        child.material = child.material.clone();
                        child.material.depthWrite = true;
                    }
                }
            });

            scene.add(object);

            resolve(object);
        }, undefined, function (error) {
            console.error('An error happened', error);
            reject(error);
        });
    });
}