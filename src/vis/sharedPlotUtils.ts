import * as d3 from "d3";
import { BaseType } from "d3";

export class Color {
    private r: number;
    private g: number;
    private b: number;
    private a: number;

    constructor(r: number, g: number, b: number, a: number = 255) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    toString() {
        return 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + this.a / 255 + ')';
    }

    withAlpha(alpha: number) {
        return new Color(this.r, this.g, this.b, alpha);
    }
}

export class PlotStyle {
    private borderColor: Color;
    private borderColorWhileSelected: Color;
    private borderWidth: number;

    constructor(borderColor: Color, borderColorWhileSelected: Color, borderWidth: number) {
        this.borderColor = borderColor;
        this.borderColorWhileSelected = borderColorWhileSelected;
        this.borderWidth = borderWidth;
    }

    getBorderColor() {
        return this.borderColor;
    }

    getBorderColorWhileSelected() {
        return this.borderColorWhileSelected;
    }

    getBorderWidth() {
        return this.borderWidth;
    }
}

export function drawLegend<T,R extends BaseType,S>(plot: d3.Selection<SVGSVGElement, T, R, S> | d3.Selection<SVGGElement, T, R, S>, legend: { label: string, entries: [Color, string][] }, legendBubbleRadius: number, left: boolean = true) {
    const legendGroup = plot.append('g').attr('transform', 'translate(40,60)');
    legendGroup.append('text').text(legend.label).attr('font-size', '30px').attr('fill', 'white').style('user-select', 'none');
    const legendEntries = legendGroup.selectAll('g').data(legend.entries).enter().append('g').attr('transform', (d, i) => 'translate(0,' + (i + 1) * 25 + ')');
    legendEntries.append('circle')
        .attr('r', legendBubbleRadius)
        .attr('fill', d => d[0].toString());
    legendEntries.append('text')
        .text(d => d[1])
        .attr('font-size', '15px')
        .attr('fill', 'white')
        .attr('x', 20)
        .attr('y', 5)
        .style('user-select', 'none');
    if (!left) {
        const plotBB = plot.node()!.getBoundingClientRect();
        const legendGroupWidth = legendGroup.node()!.getBoundingClientRect().width;
        legendGroup.attr('transform', 'translate(' + (plotBB.width - 2 * legendGroupWidth - 40) + ',60)');
        console.log(plotBB.width, legendGroupWidth);
    }
    return legendGroup;
}

export function getConfiguredShowCursorText(viewport: HTMLDivElement, plot: any, fontSizeInPx: number, style: PlotStyle, yOffset: number) : [(event : MouseEvent, text: any, textContent: string, node: any) => d3.Selection<SVGTextElement, unknown, null, undefined>, (text: any, node: any) => void] {
    return [(event: MouseEvent, text: any, textContent: string, node: any) => {
        const cursorPos = [event.clientX, event.clientY];
        text?.remove();
        text = plot.append('text')
            .attr('x', cursorPos[0] - viewport.getBoundingClientRect().left)
            .attr('y', yOffset + cursorPos[1] - viewport.getBoundingClientRect().top)
            .text(textContent)
            .attr('font-size', fontSizeInPx + 'px')
            .attr('fill', 'white')
            .style('text-anchor', 'middle')
            .style('text-shadow', '#000 0px 0px 1px,   #000 0px 0px 1px,   #000 0px 0px 1px,#000 0px 0px 1px,   #000 0px 0px 1px,   #000 0px 0px 1px');
        const overlapLeft = text.node().getBoundingClientRect().left - viewport.getBoundingClientRect().left;
        if (overlapLeft < 0) {
            text.attr('x', text.attr('x') - overlapLeft);
        }
        const overlapRight = text.node().getBoundingClientRect().right - viewport.getBoundingClientRect().right;
        if (overlapRight > 0) {
            text.attr('x', text.attr('x') - overlapRight);
        }
        return text;
    },
    (text:any, node: any) => {
        node
            .attr('stroke', style.getBorderColor().toString())
            .attr('stroke-width', style.getBorderWidth());
        text?.remove();
    }];
}

export function highlightNode<T extends BaseType,R,S extends BaseType,Q>(style: PlotStyle, node: d3.Selection<T, R, S, Q>, moveToFront: boolean) {
    node
        .attr('stroke', style.getBorderColorWhileSelected().toString())
        .attr('stroke-width', style.getBorderWidth() * 2);
    if (moveToFront) {
        node.each(function() {
            d3.select(this).raise();
        });
    }
}

export function highlightNodeSecondary<T extends BaseType,R,S extends BaseType,Q>(style: PlotStyle, node: d3.Selection<T, R, S, Q>, moveToFront: boolean) {
    node
        .attr('stroke', style.getBorderColorWhileSelected().toString())
        //.attr('stroke', style.getBorderColorWhileSelected().withAlpha(128).toString())
        .attr('stroke-width', style.getBorderWidth()*2);
    if (moveToFront) {
        node.each(function() {
            d3.select(this).raise();
        });
    }
}

export function unhiglightNode(style: PlotStyle, node: any) {
    node
        .attr('stroke', style.getBorderColor().toString())
        .attr('stroke-width', style.getBorderWidth());
}

export function setupTextAppearance(texts: any, fontSizeInPxFunc: (node: any) => number) {
    texts.attr('fill', 'white')
        .style('text-anchor', 'middle')
        .style('alignment-baseline', 'middle')
        .style('user-select', 'none')
        .style('text-shadow', '#000 0px 0px 1px,   #000 0px 0px 1px,   #000 0px 0px 1px,#000 0px 0px 1px,   #000 0px 0px 1px,   #000 0px 0px 1px')
        .style('display', 'none')
        .attr('font-size', (d: any) => fontSizeInPxFunc(d) + 'px');
}

export function setupACheckbox(legendGroup: any, size: [number, number], offset: [number, number], label: string, initialCheckedValue: boolean, callback: (showLabels: boolean) => void) {
    let checked = initialCheckedValue;
    const checkboxColor = "rgb(100,100,100)";
    const checkBoxCheckColor = "white";
    const checkbox = legendGroup.append('g').attr('transform', 'translate(' + offset[0] + ',' + (size[1] - 100 - offset[1]) + ')');
    checkbox.append('rect').attr('width', 20).attr('height', 20).attr('fill', checkboxColor).attr('stroke', 'white').attr('stroke-width', 1);
    const checkBoxFilling = checkbox.append('path').attr('d', 'M 3 3 L 17 17 M 3 17 L 17 3').attr('fill', 'none').attr('stroke', checked ? checkBoxCheckColor : 'none').attr('stroke-width', 2);
    checkbox.append('text').text(label).attr('font-size', '15px').attr('fill', 'white').attr('x', 30).attr('y', 15).style('user-select', 'none').attr('cursor', 'pointer')
        .on('click', () => {
            checked = !checked;
            callback(checked);
            checkBoxFilling.attr('stroke', checked ? checkBoxCheckColor : 'none');
        });
    checkbox.append('rect').attr('width', 20).attr('height', 20).attr('fill', 'transparent').attr('cursor', 'pointer').on('click', () => {
        checked = !checked;
        callback(checked);
        checkBoxFilling.attr('stroke', checked ? checkBoxCheckColor : checkboxColor);
    });
}