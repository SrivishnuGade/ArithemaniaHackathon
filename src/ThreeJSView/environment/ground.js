// src/environment/ground.js
import * as THREE from 'three';

// Creates a 3D ground plane divided into 40x40 tiles, each colored based on NDVI values
export function initGround(scene, ndvi) {
    const gridSize = 40; // Number of tiles along one side
    const tileSize = 1000 / gridSize; // Size of each tile (1000 is the ground size)

    const group = new THREE.Group(); // Group to hold all tiles

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            // Get the NDVI value for the current tile
            const ndviValue = ndvi[i] && ndvi[i][j] ? parseFloat(ndvi[i][j]) : 0;

            // Map NDVI value to a shade of green (0x000000 to 0x00FF00)
            const greenShade = Math.floor(ndviValue * 255); // Scale NDVI (0 to 1) to 0-255
            const color = new THREE.Color(`rgb(0, ${greenShade}, 0)`);

            // Create a tile with the corresponding color
            const tileGeometry = new THREE.PlaneGeometry(tileSize, tileSize);
            const tileMaterial = new THREE.MeshStandardMaterial({ color: color });
            const tile = new THREE.Mesh(tileGeometry, tileMaterial);
            tile.receiveShadow = true;
            // Position the tile in the grid
            tile.rotation.x = -Math.PI / 2; // Rotate to lie flat
            tile.position.x = -500 + tileSize * (i + 0.5); // Centered on the ground
            tile.position.z = -500 + tileSize * (j + 0.5); // Centered on the ground

            // Add the tile to the group
            group.add(tile);
        }
    }
    // group.receiveShadow = true; // Allow the group to receive shadows

    // Add the group of tiles to the scene
    scene.add(group);
}

