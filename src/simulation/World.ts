import RAPIER from '@dimforge/rapier2d-compat';

export class World {
    world: RAPIER.World;
    eventQueue: RAPIER.EventQueue;

    // Simulation bounds
    width: number = 2000;
    height: number = 2000;

    // Entities
    boids: any[] = []; // Type Boid
    foods: RAPIER.RigidBody[] = [];
    poisons: RAPIER.RigidBody[] = [];

    // Collision Groups (Member/Filter)
    // 0x0001: Boids
    // 0x0002: Food
    // 0x0004: Poison

    constructor() {
        // Gravity is zero for a top-down simulation
        const gravity = { x: 0.0, y: 0.0 };
        this.world = new RAPIER.World(gravity);
        this.eventQueue = new RAPIER.EventQueue(true);
    }

    async init() {
        await RAPIER.init();
        // Re-create world after init if needed, or just ensure init is called before constructor usage in main
    }

    step() {
        this.world.step(this.eventQueue);

        // Wrap entities
        this.world.forEachRigidBody((body) => {
            const pos = body.translation();
            let changed = false;
            if (pos.x < -this.width / 2) { pos.x += this.width; changed = true; }
            if (pos.x > this.width / 2) { pos.x -= this.width; changed = true; }
            if (pos.y < -this.height / 2) { pos.y += this.height; changed = true; }
            if (pos.y > this.height / 2) { pos.y -= this.height; changed = true; }

            if (changed) {
                body.setTranslation(pos, true);
            }
        });

        // Dispatch collision events here if needed
        this.eventQueue.drainCollisionEvents(() => {
            // TODO: Handle collisions
        });
    }

    clear() {
        this.world.free();
        this.boids = [];
        this.foods = [];
        this.poisons = [];
    }

    spawnFood() {
        const x = (Math.random() - 0.5) * this.width;
        const y = (Math.random() - 0.5) * this.height;

        let bodyDesc = RAPIER.RigidBodyDesc.fixed()
            .setTranslation(x, y);
        let body = this.world.createRigidBody(bodyDesc);

        let colliderDesc = RAPIER.ColliderDesc.ball(5) // Radius 5 for food
            .setSensor(true)
            .setCollisionGroups(0x00020001); // Member: 0002 (Food), Filter: 0001 (Boids)

        this.world.createCollider(colliderDesc, body);
        this.foods.push(body);
    }

    spawnPoison() {
        const x = (Math.random() - 0.5) * this.width;
        const y = (Math.random() - 0.5) * this.height;

        let bodyDesc = RAPIER.RigidBodyDesc.fixed()
            .setTranslation(x, y);
        let body = this.world.createRigidBody(bodyDesc);

        // Poison might be larger?
        let colliderDesc = RAPIER.ColliderDesc.ball(5)
            .setSensor(true)
            .setCollisionGroups(0x00040001); // Member: 0004 (Poison), Filter: 0001 (Boids)

        this.world.createCollider(colliderDesc, body);
        this.poisons.push(body);
    }
}
