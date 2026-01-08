import { Animal } from './Animal';

export class Prey extends Animal {
    constructor(scene) {
        super(
            scene,
            '/assets/deer/source/deer.fbx',
            '/assets/deer/textures/Antelope_Diffuse.png'
        );
    }

    async initialize() {
        await this.load();
        if (this.model.animations && this.model.animations.length) {
            this.action = this.mixer.clipAction(this.model.animations[3]);
            this.action.play();
        }
    }
}