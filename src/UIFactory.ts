export class UIFactory {

    public static SYMBOL_PLUS = "+";
    public static HIDDEN = "****";
    //[" ⮝"," ⮟"];
    public static SORT_SYMBOL_ARROW_UP = "▲";
    public static SORT_SYMBOL_ARROW_DOWN = "▼";

    public static fabricateInputButtonCombo(placeholder: string[], buttonText: string, isSecret: boolean[], initialValues: string[], buttonCallback: (inputValues: string[]) => void) {
        const comboWrapper = document.createElement("div");
        comboWrapper.classList.add("horizontal-container");
        comboWrapper.classList.add("points-ui-input-combo");
        for (let i = 0; i < placeholder.length; i++) {
            const input = document.createElement("input");
            input.type = isSecret[i] ? "password" : "text";
            input.placeholder = placeholder[i];
            input.value = initialValues[i];
            comboWrapper.appendChild(input);
        }
        const button = document.createElement("div");
        button.textContent = buttonText;
        comboWrapper.appendChild(button);
        button.onclick = function() {
            buttonCallback(Array.from(comboWrapper.children).filter((c) => c instanceof HTMLInputElement).map((c) => (c as HTMLInputElement).value));
        };
        comboWrapper.addEventListener("keyup", function(event) {
            if (event.key === "Enter") {
                button.click();
            }
        });
        return comboWrapper;
    }
}