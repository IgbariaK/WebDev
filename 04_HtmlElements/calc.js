document.addEventListener("DOMContentLoaded", () => {
    initCalculator();
});

function initCalculator() {
    // 1. Get Element References
    const btnCalc = document.getElementById('btnCalc');
    const btnClear = document.getElementById('btnClearHistory');
    const btnRemoveSelected = document.getElementById('btnRemoveSelected');

    // 2. Attach Event Listeners
    btnCalc.addEventListener('click', performCalculation);

    // Clear All Logic
    btnClear.addEventListener('click', () => {
        document.getElementById('historyList').innerHTML = "";
    });

    // Remove Selected Logic
    btnRemoveSelected.addEventListener('click', removeSelectedHistoryItem);
}

function removeSelectedHistoryItem() {
    const historyList = document.getElementById('historyList');

    // selectedIndex returns -1 if nothing is selected
    if (historyList.selectedIndex !== -1) {
        // Remove the option at the selected index
        historyList.remove(historyList.selectedIndex);
    } else {
        alert("Please select an item in the list to remove.");
    }
}

function performCalculation() {
    // Elements
    const txt1 = document.getElementById('txt1');
    const txt2 = document.getElementById('txt2');
    const op = document.getElementById('operator');
    const lblRes = document.getElementById('lblRes');
    const historyList = document.getElementById('historyList');

    // Reset styles (remove error red borders)
    txt1.classList.remove('is-invalid');
    txt2.classList.remove('is-invalid');
    lblRes.classList.remove('text-danger');
    lblRes.style.color = "#0d6efd"; // Reset to blue

    // --- VALIDATION START ---
    const val1 = txt1.value.trim();
    const val2 = txt2.value.trim();
    let isValid = true;

    // Check if empty or not a number
    if (val1 === "" || isNaN(val1)) {
        txt1.classList.add('is-invalid'); // Bootstrap error class
        isValid = false;
    }

    if (val2 === "" || isNaN(val2)) {
        txt2.classList.add('is-invalid'); // Bootstrap error class
        isValid = false;
    }

    if (!isValid) {
        lblRes.innerText = "Error";
        lblRes.classList.add('text-danger');
        return; // Stop function here
    }
    // --- VALIDATION END ---


    // Parsing
    const n1 = parseFloat(val1);
    const n2 = parseFloat(val2);
    let result = 0;
    let symbol = "+";

    // Calculation Switch
    switch (op.value) {
        case "+":
            result = n1 + n2;
            symbol = "+";
            break;
        case "-":
            result = n1 - n2;
            symbol = "-";
            break;
        case "*":
            result = n1 * n2;
            symbol = "×";
            break;
        case "/":
            if (n2 === 0) {
                lblRes.innerText = "Cannot divide by 0";
                lblRes.classList.add('text-danger');
                txt2.classList.add('is-invalid');
                return;
            }
            result = n1 / n2;
            symbol = "÷";
            break;
    }

    // Limit decimals for cleaner UI
    const finalResult = Number.isInteger(result) ? result : result.toFixed(2);

    // Update Result Label
    lblRes.innerText = finalResult;

    // Add to ListBox History
    addToHistory(n1, symbol, n2, finalResult, historyList);
}

function addToHistory(n1, symbol, n2, res, listElement) {
    // Create format: "10 + 5 = 15"
    const text = `${n1} ${symbol} ${n2} = ${res}`;

    // Create <option> element
    const option = document.createElement("option");
    option.text = text;

    // Add to the top of the list (index 0)
    if (listElement.options.length > 0) {
        listElement.add(option, listElement.options[0]);
    } else {
        listElement.add(option);
    }

    // Highlight the new item automatically
    listElement.selectedIndex = 0;
}