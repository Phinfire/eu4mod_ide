import { Point } from "./Point";
import * as d3 from "d3";

export class Plot {

    constructor(parent: HTMLElement, points: Point<string, string>[]) {
        const width = parent.clientWidth;
        const height = parent.clientHeight;
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height);

        const xScale = d3.scaleLinear()
            .domain([d3.min(points, d => d.getX())!, d3.max(points, d => d.getX())!])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([d3.min(points, d => d.getY())!, d3.max(points, d => d.getY())!])
            .range([height, 0]);

        svg.selectAll("circle")
            .data(points)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d.getX()))
            .attr("cy", d => yScale(d.getY()))
            .attr("r", 4)
            .attr("fill", d => d.getColorKey())
            .attr("stroke", "black");

        parent.appendChild(svg.node()!);
        console.log("Plot ["  + width + ", " + height + "] created for " + points.length + " points");
    }
}