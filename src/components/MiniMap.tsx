import React, { useEffect, useRef } from 'react';
import { World } from '../simulation/World';

interface MiniMapProps {
    world: World;
}

export const MiniMap: React.FC<MiniMapProps> = ({ world }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;

        const render = () => {
            // Clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Map world coords (-w/2, -h/2) to (w/2, h/2) to canvas (0, 0) to (cw, ch)
            const scaleX = canvas.width / world.width;
            const scaleY = canvas.height / world.height;
            const scale = Math.min(scaleX, scaleY);

            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(scale, scale);

            // Draw Boids
            ctx.fillStyle = 'white';
            world.boids.forEach(b => {
                if (b.isDead) return; // Don't draw dead on map?
                const pos = b.body.translation();
                ctx.fillRect(pos.x - 10, pos.y - 10, 20, 20); // Scale up for visibility?
            });

            // Draw Food
            ctx.fillStyle = '#00ff00';
            world.foods.forEach(f => {
                const pos = f.translation();
                ctx.fillRect(pos.x - 5, pos.y - 5, 10, 10);
            });

            // Draw Poison
            ctx.fillStyle = '#ff0000';
            world.poisons.forEach(p => {
                const pos = p.translation();
                ctx.fillRect(pos.x - 5, pos.y - 5, 10, 10);
            });

            ctx.restore();
            animId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animId);
    }, [world]);

    return (
        <div style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            width: '200px',
            height: '200px',
            background: 'rgba(0,0,0,0.8)',
            border: '1px solid white'
        }}>
            <canvas ref={canvasRef} width={200} height={200} />
        </div>
    );
};
