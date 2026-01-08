import { Animal } from './Animal';

export class Predator extends Animal {
    constructor(scene) {
        super(
            scene,
            '/assets/tiger/source/tiger_run.fbx',
            '/assets/tiger/textures/FbxTemp_0001.png'
        );
    }

    async initialize() {
        await this.load();
        if (this.model.animations && this.model.animations.length) {
            this.action = this.mixer.clipAction(this.model.animations[0]);
            this.action.play();
        }
    }
}