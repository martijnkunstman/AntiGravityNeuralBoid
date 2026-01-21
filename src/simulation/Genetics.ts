import { Boid } from './Boid';
import { NeuralNetwork } from './NeuralNetwork';
import { World } from './World';

export class GeneticAlgorithm {
    populationSize: number;
    mutationRate: number;
    world: World;

    currentGeneration: number = 1;
    bestFitness: number = 0;
    templateBrain: any = null;

    constructor(world: World, size: number, mutationRate: number = 0.05) {
        this.world = world;
        this.populationSize = size;
        this.mutationRate = mutationRate;
    }

    // Initialize first generation
    createStartPopulation() {
        for (let i = 0; i < this.populationSize; i++) {
            const x = (Math.random() - 0.5) * this.world.width;
            const y = (Math.random() - 0.5) * this.world.height;
            const boid = new Boid(this.world, i, x, y);

            // Init brain
            const inputCount = boid.sensorCount * 2;
            const hiddenCount = 8; // Configurable
            const outputCount = 2; // Left, Right thrust

            if (this.templateBrain) {
                boid.brain = NeuralNetwork.deserialize(this.templateBrain, inputCount, hiddenCount, outputCount);
                boid.brain.mutate(this.mutationRate);
            } else {
                boid.brain = new NeuralNetwork(inputCount, hiddenCount, outputCount);
            }
            this.world.boids.push(boid);
        }
    }

    evolve() {
        // 1. Calculate fitness (already done in Boid update)
        // 2. Select parents
        // 3. Create next gen

        const oldBoids = this.world.boids;

        // Find best fitness for stats
        let maxFit = 0;
        oldBoids.forEach(b => {
            if (b.fitness > maxFit) maxFit = b.fitness;
        });
        this.bestFitness = maxFit;

        const newBoids: Boid[] = [];

        // Use template if available to override evolution? 
        // Or assume template is used for *start* and then user wants to evolve?
        // Let's assume template allows "restarting" with a brain.
        // If template is set mid-simulation (via Load), maybe we just use it for the next generation completely.

        if (this.templateBrain) {
            for (let i = 0; i < this.populationSize; i++) {
                const x = (Math.random() - 0.5) * this.world.width;
                const y = (Math.random() - 0.5) * this.world.height;
                const child = new Boid(this.world, i, x, y);

                child.brain = NeuralNetwork.deserialize(this.templateBrain, child.sensorCount * 2, 8, 2);
                child.brain.mutate(this.mutationRate);
                newBoids.push(child);
            }
            // Reset template so subsequent generations evolve naturally from this seed?
            this.templateBrain = null;
        } else {
            for (let i = 0; i < this.populationSize; i++) {
                const parentA = this.pickOne(oldBoids);
                const parentB = this.pickOne(oldBoids);

                const childBrain = parentA.brain!.crossover(parentB.brain!);
                childBrain.mutate(this.mutationRate);

                const x = (Math.random() - 0.5) * this.world.width;
                const y = (Math.random() - 0.5) * this.world.height;
                const child = new Boid(this.world, i, x, y);
                child.brain = childBrain;

                newBoids.push(child);
            }
        }

        // Cleanup old boids
        oldBoids.forEach(b => b.destroy());

        this.world.boids = newBoids;
        this.currentGeneration++;
    }

    pickOne(boids: Boid[]): Boid {
        // Tournament selection
        const sub = [];
        for (let i = 0; i < 3; i++) {
            sub.push(boids[Math.floor(Math.random() * boids.length)]);
        }
        sub.sort((a, b) => b.fitness - a.fitness);
        return sub[0];
    }
}
