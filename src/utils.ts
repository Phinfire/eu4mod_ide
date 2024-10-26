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
    flag.style.clipPath = getCoatOfArmsPolygonClipPathString();
    flag.addEventListener("dragstart", (event) => {
        event.preventDefault();
    });
}

export function getCoatOfArmsPolygonClipPath() {
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
    return clipPolyPoints;
}

export function getCircularPolygonClipPath() {
    const center = {x: 50, y: 50};
    const radius = 50;
    const steps = 20;
    const clipPolyPoints = [];
    for (let i = 0; i < steps; i++) {
        const x = center.x + Math.cos(i / steps * 2 * Math.PI) * radius;
        const y = center.y + Math.sin(i / steps * 2 * Math.PI) * radius;
        clipPolyPoints.push({x: x, y: y});
    }
    return clipPolyPoints;
}

export function getCoatOfArmsPolygonClipPathString() {
    return "polygon(" + getCoatOfArmsPolygonClipPath().map(p => p.x + "% " + p.y + "%").join(",") + ")";
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

export function setCookie(name: string, value: string, days: number) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

export function getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

export function ifHasCookieValueGetElseSetAndReturn(name: string, value: string): string {
    const cookieValue = getCookie(name);
    if (cookieValue) {
        return cookieValue;
    }
    setCookie(name, value, 365);
    return value;
}

export function createDiv(clazz: string) {
    const element = document.createElement("div");
    element.className = clazz;
    return element;
}