export class UIFactory {

    public static SYMBOL_PLUS = "+";
    public static HIDDEN = "****";
    //[" ⮝"," ⮟"];
    public static SORT_SYMBOL_ARROW_UP = "▲";
    public static SORT_SYMBOL_ARROW_DOWN = "▼";

    public static RED_X = "❌";

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

    public static fabricateLobbyPanelTableRow(label: string, value: string, secret: boolean) {
        const row = document.createElement('tr');
        const cell1 = document.createElement('td');
        const cell2 = document.createElement('td');
        cell1.style.textAlign = "right";
        cell1.style.paddingRight = "40px";
        cell2.style.width = "50%";
        row.appendChild(cell1);
        row.appendChild(cell2);
        cell1.innerHTML = label + ":";
        cell2.innerHTML = secret ? UIFactory.HIDDEN : value;
        if (secret) {
            cell2.onmouseenter = () => {
                cell2.innerHTML = value;
            }
            cell2.onmouseleave = () => {
                cell2.innerHTML = UIFactory.HIDDEN;
            }
        }
        return row;
    }
}