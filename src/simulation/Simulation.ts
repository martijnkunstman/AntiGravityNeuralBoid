import { World } from './World';
import { GeneticAlgorithm } from './Genetics';
import RAPIER from '@dimforge/rapier2d-compat';

export class Simulation {
    world: World;
    ga: GeneticAlgorithm;
    running: boolean = false;
    animationId: number | null = null;

    // Config
    populationSize: number = 50;

    constructor() {
        this.world = new World();
        this.ga = new GeneticAlgorithm(this.world, this.populationSize);
    }

    async init() {
        await RAPIER.init();
        // Re-initialize world with correct internal state if RAPIER wasn't ready in constructor
        this.world = new World();
        this.ga = new GeneticAlgorithm(this.world, this.populationSize);
        this.ga.createStartPopulation();

        // Spawn initial food/poison
        for (let i = 0; i < 50; i++) this.world.spawnFood();
        for (let i = 0; i < 30; i++) this.world.spawnPoison();
    }

    start(renderCallback: () => void) {
        this.running = true;

        const loop = () => {
            if (!this.running) return;

            // Multiple physics steps per frame for stability/speed if desired
            this.world.step();

            // Update Boids
            let aliveCount = 0;
            this.world.boids.forEach(b => {
                b.update(0.016); // dt
                if (!b.isDead) aliveCount++;
            });

            // Check for evolution
            if (aliveCount === 0) {
                this.world.clear();
                // Re-spawn static entities?
                // Or we need to clear boids only?
                // World.clear() frees everything.

                // Re-init world physics?
                this.world = new World();
                this.ga.world = this.world;

                this.ga.evolve();
                // Respawn things
                for (let i = 0; i < 50; i++) this.world.spawnFood();
                for (let i = 0; i < 30; i++) this.world.spawnPoison();
            }

            renderCallback();

            this.animationId = requestAnimationFrame(loop);
        };
        loop();
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}
