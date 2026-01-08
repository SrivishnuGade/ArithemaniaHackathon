// This code loads the tree model from the FBX file,
// applies textures from the textures folder, and adds it to the scene.
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { TextureLoader } from 'three';

export function loadTree(scene) {
    const fbxLoader = new FBXLoader();
    const textureLoader = new TextureLoader();

    fbxLoader.load('/assets/tree-for-games/source/Tree_Skeatchfab.fbx', (fbx) => {
        fbx.scale.set(0.03, 0.03, 0.03); // Adjust the scale as needed
        fbx.position.set(10, 0, 10); // Adjust the position as needed

        // Default texture to apply if no specific texture is found
        const defaultTexture = textureLoader.load('/assets/tree-for-games/textures/default-leaf-texture.png', () => {
            console.log('Default texture loaded successfully.');
        }, undefined, (error) => {
            console.warn('Failed to load default texture:', error);
        });

        // Traverse the FBX model and apply textures
        fbx.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;

                // Automatically load and apply textures based on material names
                if (node.material) {
                    const materialName = node.material.name ? node.material.name.toLowerCase() : null;
                    const texturePath = materialName
                        ? `/assets/tree-for-games/textures/${materialName}.tga.png`
                        : null;

                    // Load and apply the texture, or use the default texture
                    const texture = texturePath
                        ? textureLoader.load(texturePath, () => {
                            console.log(`Loaded texture: ${texturePath}`);
                        }, undefined, (error) => {
                            console.warn(`Failed to load texture: ${texturePath}, applying default texture.`, error);
                            node.material.map = defaultTexture; // Apply default texture on failure
                            node.material.needsUpdate = true;
                        })
                        : defaultTexture;

                    node.material.map = texture; // Apply the texture to the material
                    node.material.needsUpdate = true; // Ensure the material updates
                }
            }
        });

        scene.add(fbx);
        console.log('Tree model loaded successfully:', fbx);
    }, undefined, (error) => {
        console.error('An error occurred while loading the tree model:', error);
    });
}