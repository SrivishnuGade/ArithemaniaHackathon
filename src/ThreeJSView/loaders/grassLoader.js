// This code loads the grass model from the FBX file,
// applies textures from the textures folder, and adds it to the scene.
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { TextureLoader } from 'three';

export function loadGrass(scene) {
    const fbxLoader = new FBXLoader();
    const textureLoader = new TextureLoader();

    fbxLoader.load('/assets/grass-green/source/Grass_green.fbx', (fbx) => {
        fbx.scale.set(1, 1, 1); // Adjust the scale as needed
        fbx.position.set(0, 0, 0); // Adjust the position as needed

        // // Load the textures
        // const colorTexture = textureLoader.load('/assets/grass-green/textures/Grass_green.png', () => {
        //     console.log('Grass color texture loaded successfully.');
        // }, undefined, (error) => {
        //     console.warn('Failed to load grass color texture:', error);
        // });

        // const normalTexture = textureLoader.load('/assets/grass-green/textures/Normal_grass.png', () => {
        //     console.log('Grass normal texture loaded successfully.');
        // }, undefined, (error) => {
        //     console.warn('Failed to load grass normal texture:', error);
        // });

        // Traverse the FBX model and apply textures
        fbx.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;

                // Apply the textures to the material
                if (node.material) {
                    // node.material.map = colorTexture; // Apply the color texture
                    // node.material.normalMap = normalTexture; // Apply the normal map
                    node.material.needsUpdate = true; // Ensure the material updates
                }
            }
        });

        scene.add(fbx);
        console.log('Grass model loaded successfully:', fbx);
    }, undefined, (error) => {
        console.error('An error occurred while loading the grass model:', error);
    });
}