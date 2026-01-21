import React, { useEffect, useRef } from 'react';
import { NeuralNetwork } from '../simulation/NeuralNetwork';

interface NetworkVisualizerProps {
    brain?: NeuralNetwork;
}

export const NetworkVisualizer: React.FC<NetworkVisualizerProps> = ({ brain }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !brain) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw Nodes
            const layerX = [30, 150, 270]; // Input, Hidden, Output X positions
            // Calculate Y positions based on counts

            const drawLayer = (count: number, x: number) => {
                const step = canvas.height / (count + 1);
                const pos = [];
                for (let i = 0; i < count; i++) {
                    const y = step * (i + 1);
                    pos.push({ x, y });

                    ctx.beginPath();
                    ctx.arc(x, y, 5, 0, Math.PI * 2);
                    ctx.fillStyle = 'white';
                    // If values provided, color based on activation?
                    ctx.fill();
                    ctx.stroke();
                }
                return pos;
            };

            const inPos = drawLayer(brain.inputNodes, layerX[0]);
            const hidPos = drawLayer(brain.hiddenNodes, layerX[1]);
            const outPos = drawLayer(brain.outputNodes, layerX[2]);

            // Draw Connections
            const drawConn = (from: any[], to: any[], weights: Float32Array) => {
                for (let i = 0; i < from.length; i++) {
                    for (let j = 0; j < to.length; j++) {
                        // Weight index? 
                        // weightsIH: hidden * input. Index j * input + i (or vice versa depending on my NN impl)
                        // My NN: weightsIH[j * inputNodes + i] for Input I -> Hidden J? 
                        // Let's assume standard fully connected.
                        const w = weights[j * from.length + i];

                        ctx.beginPath();
                        ctx.moveTo(from[i].x, from[i].y);
                        ctx.lineTo(to[j].x, to[j].y);
                        ctx.strokeStyle = w > 0 ? `rgba(0,255,0,${Math.abs(w)})` : `rgba(255,0,0,${Math.abs(w)})`;
                        ctx.lineWidth = Math.abs(w) * 2;
                        ctx.stroke();
                    }
                }
            };

            drawConn(inPos, hidPos, brain.weightsIH);
            drawConn(hidPos, outPos, brain.weightsHO);

            requestAnimationFrame(render);
        };
        render();
    }, [brain]);

    if (!brain) return <div style={{ color: 'white' }}>No Brain Selected</div>;

    return (
        <div style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            width: '300px',
            height: '200px',
            background: 'rgba(0,0,0,0.8)',
            border: '1px solid white'
        }}>
            <canvas ref={canvasRef} width={300} height={200} />
        </div>
    );
};
