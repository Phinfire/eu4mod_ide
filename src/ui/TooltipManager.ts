export class TooltipManager {

    private static instance: TooltipManager;

    private tooltip: HTMLDivElement;


    public static getInstance() {        
        if (!TooltipManager.instance) {
            TooltipManager.instance = new TooltipManager();
        }
        return TooltipManager.instance;
    }

    constructor() {
        this.tooltip = document.createElement("div");
        this.tooltip.classList.add("tooltip");
        document.body.appendChild(this.tooltip);
    }

    public showTooltip(event: MouseEvent, tooltipText: string) {
        this.tooltip.innerHTML = tooltipText;
        this.tooltip.style.left = `${event.pageX + 10}px`;
        this.tooltip.style.top = `${event.pageY + 10}px`;
        this.tooltip.style.opacity = '1';
    }

    public hideTooltip() {
        this.tooltip.style.opacity = '0';
    }
}