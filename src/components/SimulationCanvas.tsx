import React, { useEffect, useRef, useState } from 'react';
import { Simulation } from '../simulation/Simulation';
import { MiniMap } from './MiniMap';
import { NetworkVisualizer } from './NetworkVisualizer';
import { ConfigPanel } from './ConfigPanel';
import { Boid } from '../simulation/Boid';

function drawBoid(ctx: CanvasRenderingContext2D, boid: Boid) {
    const pos = boid.body.translation();
    const rot = boid.body.rotation();
    const size = boid.size;

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(rot);

    // Body
    const color = `hsl(${Math.max(0, 120 - (boid.age / 5))}, 100%, 50%)`;
    ctx.fillStyle = boid.health > 0 ? color : 'gray';
    ctx.fillRect(-size / 2, -size / 2, size, size);

    // Thrusters
    ctx.fillStyle = 'orange';
    // Visual indicators for thrust could go here

    // Directions
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, size); // Arrow pointing forward? (If Y is forward)
    ctx.strokeStyle = 'black';
    ctx.stroke();

    ctx.restore();
}

export const SimulationCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [sim] = useState(() => new Simulation());
    const [stats, setStats] = useState({ gen: 0, bestFitness: 0 });
    const [selectedBoid, setSelectedBoid] = useState<Boid | null>(null);

    // Click handler
    const handleClick = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const cx = e.clientX - rect.left - canvas.width / 2;
        const cy = e.clientY - rect.top - canvas.height / 2;
        const scale = 0.5;

        const wx = cx / scale;
        const wy = cy / scale;

        let nearest: Boid | null = null;
        let minDist = Infinity;

        sim.world.boids.forEach(b => {
            const pos = b.body.translation();
            const d = (pos.x - wx) ** 2 + (pos.y - wy) ** 2;
            if (d < minDist && d < 2500) { // 50px radius squared
                minDist = d;
                nearest = b;
            }
        });

        setSelectedBoid(nearest);
    };

    useEffect(() => {
        const initSim = async () => {
            await sim.init();

            const render = () => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2);
                const scale = 0.5;
                ctx.scale(scale, scale);

                // Draw Bounds
                ctx.strokeStyle = 'white';
                ctx.strokeRect(-sim.world.width / 2, -sim.world.height / 2, sim.world.width, sim.world.height);

                // Draw Food
                ctx.fillStyle = '#00ff00';
                sim.world.foods.forEach(f => {
                    const pos = f.translation();
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
                    ctx.fill();
                });

                // Draw Poison
                ctx.fillStyle = '#ff0000';
                sim.world.poisons.forEach(p => {
                    const pos = p.translation();
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
                    ctx.fill();
                });

                // Draw Boids
                sim.world.boids.forEach(b => {
                    drawBoid(ctx, b);
                });

                // Highlight selected
                if (selectedBoid && !selectedBoid.isDead) { // Check dead?
                    const pos = selectedBoid.body.translation();
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, selectedBoid.size, 0, Math.PI * 2);
                    ctx.stroke();
                }

                ctx.restore();
            };

            sim.start(render);
        };

        initSim();

        return () => {
            sim.stop();
        };
    }, [sim]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (sim.ga) {
                setStats({
                    gen: sim.ga.currentGeneration,
                    bestFitness: sim.ga.bestFitness
                });
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [sim]);

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#222', overflow: 'hidden' }} onClick={handleClick}>
            <canvas
                ref={canvasRef}
                width={window.innerWidth}
                height={window.innerHeight}
                style={{ display: 'block' }}
            />

            <div style={{ position: 'absolute', top: 10, left: 10, color: 'white', background: 'rgba(0,0,0,0.5)', padding: 10, pointerEvents: 'none' }}>
                <h3>Simulation Stats</h3>
                <p>Generation: {stats.gen}</p>
                <p>Best Fitness: {stats.bestFitness.toFixed(2)}</p>
                <p>Population: {sim.world?.boids?.length || 0}</p>
                {selectedBoid && <p>Selected Boid: {selectedBoid.id} (Fit: {selectedBoid.fitness.toFixed(1)})</p>}
            </div>

            <MiniMap world={sim.world} />
            <NetworkVisualizer brain={selectedBoid?.brain} />
            <ConfigPanel sim={sim} />
        </div>
    );
};
