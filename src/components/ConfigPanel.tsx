import React, { useEffect, useRef } from 'react';
import { Pane } from 'tweakpane';
import { Simulation } from '../simulation/Simulation';

interface ConfigPanelProps {
    sim: Simulation;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ sim }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const pane = new Pane({ container: containerRef.current, title: 'Configuration' });

        // General
        // @ts-ignore
        const f1 = pane.addFolder({ title: 'Simulation' });
        f1.addBinding(sim, 'populationSize', { min: 10, max: 200, step: 10 });
        f1.addButton({ title: 'Restart' }).on('click', () => {
            window.location.reload();
        });

        // Genetics
        // @ts-ignore
        const f2 = pane.addFolder({ title: 'Genetics' });
        f2.addBinding(sim.ga, 'mutationRate', { min: 0.0, max: 1.0 });

        // Entities
        const config = {
            sensorLength: 200
        };

        // @ts-ignore
        const f3 = pane.addFolder({ title: 'Boids' });
        f3.addBinding(config, 'sensorLength', { min: 50, max: 500 }).on('change', (ev: any) => {
            sim.world.boids.forEach(b => b.sensorLength = ev.value);
        });

        // Save/Load
        // @ts-ignore
        const f4 = pane.addFolder({ title: 'Persistence' });
        f4.addButton({ title: 'Save Best Brain' }).on('click', () => {
            // Find best
            let best = sim.world.boids[0];
            sim.world.boids.forEach(b => { if (b.fitness > best.fitness) best = b; });
            if (best && best.brain) {
                const json = JSON.stringify(best.brain.serialize());
                localStorage.setItem('best_brain', json);
                alert('Saved best brain!');
            }
        });

        f4.addButton({ title: 'Load Brain (Next Gen)' }).on('click', () => {
            const json = localStorage.getItem('best_brain');
            if (json) {
                // We need a way to inject this into next gen
                // For now, hack: set a global flag or similar
                // Or better, add method to GA
                // sim.ga.loadTemplate(JSON.parse(json));
                alert('Load not fully impl yet');
            } else {
                alert('No saved brain found');
            }
        });

        return () => {
            pane.dispose();
        };
    }, [sim]);

    return (
        <div ref={containerRef} style={{ position: 'absolute', top: 10, right: 10, width: '250px' }} />
    );
};
