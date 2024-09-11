export function mapsAreEqual<T,R>(map1: Map<T,R>, map2: Map<T,R>): boolean {
    if (map1.size != map2.size) {
        return false;
    }
    for (let key of map1.keys()) {
        if (!map2.has(key)) {
            return false;
        }
        if (map1.get(key) != map2.get(key)) {
            return false;
        }
    }
    return true;
}


export function setupCoatOfArmsPolygonClipPath(flag: HTMLImageElement) {
    const startCurve = 40;
    const halfCurveSteps = 10;
    const clipPolyPoints = [];
    const halfWidth = 50; 
    clipPolyPoints.push({x: 0, y: 0});
    clipPolyPoints.push({x: 100, y: 0});
    clipPolyPoints.push({x: 100, y: startCurve});
    const circleCenter = {x: 50, y: startCurve};
    const scaleyTestRatio = (100-startCurve) / halfWidth;
    const circleRadius = halfWidth;
    for (let i = 1; i <= halfCurveSteps; i++) {
        const y = circleCenter.y + scaleyTestRatio * Math.sin(i / halfCurveSteps * Math.PI / 2) * circleRadius;
        const x = circleCenter.x + Math.cos(i / halfCurveSteps * Math.PI / 2) * circleRadius;
        clipPolyPoints.push({x: x, y: y});
    }
    const length = clipPolyPoints.length;
    for (let i = length -1 ; i > 1; i--) {
        const partner: { x: number, y: number } = clipPolyPoints[i];
        clipPolyPoints.push({x: (100-partner.x), y: partner.y});
    }
    flag.style.clipPath = "polygon(" + clipPolyPoints.map(p => p.x + "% " + p.y + "%").join(",") + ")";
    flag.addEventListener("dragstart", (event) => {
        event.preventDefault();
    });
}


export function resolveAmbigousPointExpression(rawExpression: string) {
    const expression = rawExpression.trim();
    if (/^\d+$/.test(expression)) {
        return parseInt(expression);
    }
    if (expression.indexOf("=") != -1) { // assume only one = sign
        const partTotals = expression.split("=").map(part => part.trim()).map(part => {
            if (/^\d+$/.test(part)) {
                return parseInt(part);
            } else {
                return resolveAdditionExpression(part);
            }
        });
        const testSet = new Set(partTotals);
        if (testSet.size == 1) {
            return partTotals[0];
        }
        throw new Error("Invalid expression: \"" + expression + "\"");
    } else if (expression.indexOf("+") != -1) {
        return resolveAdditionExpression(expression);
    }
    throw new Error("Invalid expression: \"" + expression + "\"");
}

function resolveAdditionExpression(input: string) {
    return input.split("+").map(part => part.trim()).map(part => {
        if (/^\d+$/.test(part)) {
            return parseInt(part);
        }
        throw new Error("Invalid component expression: \"" + part + "\"");
    }).reduce((a, b) => a + b, 0);
}