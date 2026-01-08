import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// Images for prey and predators
import preyImg from "./deer.png"; // Add a small rabbit image in your public/assets folder
import predatorImg from "./lion (25).png"; // Add a fox or wolf image in your public/assets folder

const WIDTH = 800;
const HEIGHT = 500;
const NUM_PREY = 50;
const NUM_PREDATORS = 10;

// Initial Population
let preyCount = NUM_PREY;
let predatorCount = NUM_PREDATORS;

const PredatorPreySimulation = () => {
    const svgRef = useRef();
    const [populationData, setPopulationData] = useState([]);
    let prey = [];
    let predators = [];

    useEffect(() => {
        const svg = d3.select(svgRef.current)
            .attr("width", WIDTH)
            .attr("height", HEIGHT)
            .style("background", "#e0ffe0");

        function initializeSimulation() {
            prey = d3.range(preyCount).map(() => ({
                x: Math.random() * WIDTH,
                y: Math.random() * HEIGHT,
                speed: Math.random() * 2 + 1
            }));

            predators = d3.range(predatorCount).map(() => ({
                x: Math.random() * WIDTH,
                y: Math.random() * HEIGHT,
                speed: Math.random() * 2 + 2
            }));
        }

        function updateSimulation() {
            // Move prey randomly
            prey.forEach(p => {
                p.x += (Math.random() - 0.5) * p.speed;
                p.y += (Math.random() - 0.5) * p.speed;
                p.x = Math.max(0, Math.min(WIDTH, p.x));
                p.y = Math.max(0, Math.min(HEIGHT, p.y));
            });

            // Move predators toward nearest prey
            predators.forEach(pred => {
                let nearestPrey = prey.reduce((a, b) => 
                    Math.hypot(a.x - pred.x, a.y - pred.y) < Math.hypot(b.x - pred.x, b.y - pred.y) ? a : b
                , prey[0]);

                if (nearestPrey) {
                    pred.x += (nearestPrey.x - pred.x) * 0.02 * pred.speed;
                    pred.y += (nearestPrey.y - pred.y) * 0.02 * pred.speed;
                }
            });

            // Predation event: If predator reaches prey, prey dies
            prey = prey.filter(p => !predators.some(pred => 
                Math.hypot(pred.x - p.x, pred.y - p.y) < 10
            ));

            // Reproduction: Prey grows with food, predators decline if no food
            if (Math.random() < 0.1) prey.push({ x: Math.random() * WIDTH, y: Math.random() * HEIGHT, speed: Math.random() * 2 + 1 });
            if (Math.random() < 0.05 && predators.length > 2) predators.pop(); // Starvation

            preyCount = prey.length;
            predatorCount = predators.length;

            setPopulationData(prev => [...prev.slice(-30), { time: prev.length, prey: preyCount, predators: predatorCount }]);

            renderSimulation();
        }

        function renderSimulation() {
            // Prey as images
            svg.selectAll(".prey").data(prey)
                .join("image")
                .attr("class", "prey")
                .attr("xlink:href", preyImg) // Use rabbit image
                .attr("width", 20)
                .attr("height", 20)
                .attr("x", d => d.x - 10) // Adjust positioning
                .attr("y", d => d.y - 10);

            // Predators as images
            svg.selectAll(".predator").data(predators)
                .join("image")
                .attr("class", "predator")
                .attr("xlink:href", predatorImg) // Use fox or wolf image
                .attr("width", 25)
                .attr("height", 25)
                .attr("x", d => d.x - 12)
                .attr("y", d => d.y - 12);
        }

        initializeSimulation();
        const interval = setInterval(updateSimulation, 500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <h2>Predator-Prey Simulation</h2>
            <svg ref={svgRef}></svg>

            <h3>Population Trends</h3>
            <LineChart width={600} height={300} data={populationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="prey" stroke="blue" />
                <Line type="monotone" dataKey="predators" stroke="red" />
            </LineChart>
        </div>
    );
};

export default PredatorPreySimulation;