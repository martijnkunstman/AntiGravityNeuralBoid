import RAPIER from '@dimforge/rapier2d-compat';
import { World } from './World';
import { NeuralNetwork } from './NeuralNetwork';

export class Boid {
    id: number;
    world: World;
    body: RAPIER.RigidBody;
    collider: RAPIER.Collider;
    brain?: NeuralNetwork;

    // Config
    size: number = 20; // Size of the square boid
    sensorCount: number = 5;
    sensorLength: number = 200;
    sensorFov: number = Math.PI * 0.75;

    // State
    health: number = 100;
    maxHealth: number = 100;
    fitness: number = 0;
    age: number = 0;
    isDead: boolean = false;

    constructor(world: World, id: number, x: number, y: number) {
        this.world = world;
        this.id = id;

        // Create RigidBody
        let bodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(x, y)
            .setLinearDamping(1.0) // Space friction
            .setAngularDamping(2.0);
        this.body = world.world.createRigidBody(bodyDesc);

        // Create Collider
        let colliderDesc = RAPIER.ColliderDesc.cuboid(this.size / 2, this.size / 2)
            .setDensity(1.0);
        this.collider = world.world.createCollider(colliderDesc, this.body);
    }

    update(dt: number) {
        if (this.isDead) return;

        this.age += dt;
        this.health -= 5 * dt; // Decay health over time
        this.fitness = this.age; // Base fitness is survival time

        if (this.health <= 0) {
            this.isDead = true;
            // Kill logic handled in World?
        }

        if (this.brain) {
            const inputs = this.getSensors();
            // TODO: Input velocity or other state?
            // inputs.push(this.body.linvel().x, this.body.linvel().y);

            const outputs = this.brain.predict(inputs);
            // Outputs -1 to 1. 
            // Map to 0 to 1 for thrusters? Or allow reverse? 
            // "two trusters ... make it move around"
            // Let's assume 0-1 for simplicity, so (out + 1) / 2
            const t1 = (outputs[0] + 1) / 2;
            const t2 = (outputs[1] + 1) / 2;

            this.applyThrusters(t1, t2);
        }
    }

    applyThrusters(leftThrust: number, rightThrust: number) {
        // Clamp thrusts
        const maxThrust = 10000; // Configurable
        const l = Math.max(0, Math.min(leftThrust, 1)) * maxThrust;
        const r = Math.max(0, Math.min(rightThrust, 1)) * maxThrust;

        // Apply forces at corners
        // Local coordinates for rear corners:
        // Left Rear: (-size/2, -size/2)
        // Right Rear: (size/2, -size/2)
        // But Rapier works in local space if we use applyImpulseAtPoint? 
        // Or we can just calculate force and torque manually.

        // Simpler: Apply local force vectors at offset points
        // Forward is +Y (or +X depending on check). Let's say Forward is +Y.
        // Then Rear is -Y. Left is -X, Right is +X.

        // Left Thruster: At (-w/2, -h/2), Force (0, l)
        this.body.applyImpulseAtPoint({ x: 0, y: l * 0.016 }, { x: -this.size / 2, y: -this.size / 2 }, true);

        // Right Thruster: At (w/2, -h/2), Force (0, r)
        this.body.applyImpulseAtPoint({ x: 0, y: r * 0.016 }, { x: this.size / 2, y: -this.size / 2 }, true);
    }

    getSensors() {
        // Returns flat array of inputs: [FoodProx_0, PoisonProx_0, FoodProx_1, PoisonProx_1, ...]
        const inputs: number[] = [];
        const position = this.body.translation();
        const rotation = this.body.rotation();

        // FOV distribution
        const startAngle = -this.sensorFov / 2;
        const step = this.sensorCount > 1 ? this.sensorFov / (this.sensorCount - 1) : 0;

        for (let i = 0; i < this.sensorCount; i++) {
            const angle = startAngle + (i * step) + rotation + (Math.PI / 2);

            const dir = {
                x: Math.cos(angle),
                y: Math.sin(angle)
            };

            const ray = new RAPIER.Ray(position, dir);
            // Member: 1 (Boid). Filter: 2 (Food) | 4 (Poison) | 1 (Other Boids?)
            // We want to see Food(2) and Poison(4). Boids(1) too? Maybe later.
            // Let's filter to see everything.
            // Cast ray. Arg 4 is flags (undefined for all types), Arg 5 is groups
            const hit = this.world.world.castRay(ray, this.sensorLength, true, undefined, undefined, undefined, this.body);

            let foodProx = 0;
            let poisonProx = 0;

            if (hit) {
                const dist = hit.timeOfImpact;
                const proximity = 1.0 - (dist / this.sensorLength);

                const collider = hit.collider;
                const groups = collider.collisionGroups();
                // Groups is a 32-bit int. High 16: filter, Low 16: membership.
                // Membership: 
                // Food: 0x0002
                // Poison: 0x0004
                const membership = groups & 0xFFFF;

                if (membership & 0x0002) { // Food
                    foodProx = proximity;
                } else if (membership & 0x0004) { // Poison
                    poisonProx = proximity;
                }
                // Boid or Wall logic here if needed
            }

            inputs.push(foodProx);
            inputs.push(poisonProx);
        }
        return inputs;
    }

    destroy() {
        this.world.world.removeCollider(this.collider, false);
        this.world.world.removeRigidBody(this.body);
    }
}
