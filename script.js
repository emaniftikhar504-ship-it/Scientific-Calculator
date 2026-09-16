"use strict";


/* =========================
   DOM ELEMENTS
========================= */

const expressionDisplay =
    document.getElementById("expression");

const resultDisplay =
    document.getElementById("result");

const angleIndicator =
    document.getElementById("angleIndicator");

const angleBtn =
    document.getElementById("angleBtn");

const copyBtn =
    document.getElementById("copyBtn");

const themeBtn =
    document.getElementById("themeBtn");

const basicModeBtn =
    document.getElementById("basicModeBtn");

const scientificModeBtn =
    document.getElementById("scientificModeBtn");

const basicPad =
    document.getElementById("basicPad");

const scientificPad =
    document.getElementById("scientificPad");

const historyToggleBtn =
    document.getElementById("historyToggleBtn");

const historyPanel =
    document.getElementById("historyPanel");

const historyList =
    document.getElementById("historyList");

const clearHistoryBtn =
    document.getElementById("clearHistoryBtn");

const toast =
    document.getElementById("toast");


/* =========================
   STATE
========================= */

let currentInput = "";

let angleMode =
    localStorage.getItem("novaAngleMode") || "DEG";

let memory =
    Number(localStorage.getItem("novaMemory")) || 0;

let history = [];

try {
    history =
        JSON.parse(
            localStorage.getItem("novaHistory") || "[]"
        );
} catch {
    history = [];
}


/* =========================
   DISPLAY
========================= */

function updateDisplay() {

    expressionDisplay.textContent =
        currentInput
            .replaceAll("*", "×")
            .replaceAll("/", "÷")
            .replaceAll("^", "ʸ");

    resultDisplay.textContent =
        currentInput || "0";

    angleIndicator.textContent =
        angleMode;

    angleBtn.textContent =
        angleMode;
}


/* =========================
   TOAST
========================= */

let toastTimer;

function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 1800);
}


/* =========================
   HELPERS
========================= */

function isFunctionStart(text) {

    return (
        text.endsWith("sin(") ||
        text.endsWith("cos(") ||
        text.endsWith("tan(") ||
        text.endsWith("asin(") ||
        text.endsWith("acos(") ||
        text.endsWith("atan(") ||
        text.endsWith("sqrt(") ||
        text.endsWith("log(") ||
        text.endsWith("ln(") ||
        text.endsWith("avg(")
    );
}


function needsMultiplication(value) {

    if (!currentInput) {
        return false;
    }

    const lastChar =
        currentInput.slice(-1);

    const endsWithValue =
        /[\d)eπ]/.test(lastChar) ||
        currentInput.endsWith("pi");

    const startsWithFunction =
        value.startsWith("sin(") ||
        value.startsWith("cos(") ||
        value.startsWith("tan(") ||
        value.startsWith("asin(") ||
        value.startsWith("acos(") ||
        value.startsWith("atan(") ||
        value.startsWith("sqrt(") ||
        value.startsWith("log(") ||
        value.startsWith("ln(") ||
        value.startsWith("avg(");

    return endsWithValue &&
        (
            value === "(" ||
            value === "pi" ||
            value === "e" ||
            startsWithFunction
        );
}


/* =========================
   INPUT
========================= */

function appendValue(value) {

    /*
       Inverse trig:
       If the user has already entered a number,
       pressing sin⁻¹ converts:

       1 → sin⁻¹

       into:

       asin(1)
    */

    if (
        value === "asin(" ||
        value === "acos(" ||
        value === "atan("
    ) {

        const match =
            currentInput.match(
                /(\d+(?:\.\d+)?)$/
            );

        if (match) {

            const number =
                match[1];

            currentInput =
                currentInput.slice(
                    0,
                    -number.length
                );

            currentInput +=
                value + number + ")";

            updateDisplay();

            return;
        }
    }


    if (needsMultiplication(value)) {
        currentInput += "*";
    }


    currentInput += value;

    updateDisplay();
}


/* =========================
   CLEAR
========================= */

function clearCalculator() {

    currentInput = "";

    expressionDisplay.textContent = "";

    resultDisplay.textContent = "0";
}


/* =========================
   DELETE
========================= */

function deleteLast() {

    const functions = [
        "asin(",
        "acos(",
        "atan(",
        "sqrt(",
        "sin(",
        "cos(",
        "tan(",
        "log(",
        "avg(",
        "ln("
    ];

    for (const fn of functions) {

        if (currentInput.endsWith(fn)) {

            currentInput =
                currentInput.slice(
                    0,
                    -fn.length
                );

            updateDisplay();

            return;
        }
    }


    if (currentInput.endsWith("pi")) {

        currentInput =
            currentInput.slice(
                0,
                -2
            );

    } else {

        currentInput =
            currentInput.slice(
                0,
                -1
            );
    }


    updateDisplay();
}


/* =========================
   SQUARE
========================= */

function squareCurrent() {

    if (!currentInput) {
        showToast("Enter a value first");
        return;
    }

    currentInput =
        `(${currentInput})^2`;

    updateDisplay();
}


/* =========================
   PERCENTAGE
========================= */

function convertPercentages(expression) {

    return expression.replace(
        /(\d+(?:\.\d+)?)%/g,
        "($1/100)"
    );
}


/* =========================
   CALCULATOR ENGINE
========================= */

function evaluateExpression(expression) {

    let exp = expression;

    /*
       Security:
       Only calculator characters are allowed.
    */

    if (
        !/^[0-9+\-*/^().,%a-zA-Zπ]+$/.test(exp)
    ) {
        throw new Error("Invalid expression");
    }


    const allowedWords = [
        "sin",
        "cos",
        "tan",
        "asin",
        "acos",
        "atan",
        "sqrt",
        "log",
        "ln",
        "avg",
        "pi",
        "e"
    ];


    const words =
        exp.match(/[a-zA-Z]+/g) || [];


    for (const word of words) {

        if (!allowedWords.includes(word)) {
            throw new Error("Invalid function");
        }
    }


    /* Percentage */

    exp =
        convertPercentages(exp);


    /* Constants */

    exp =
        exp.replaceAll("π", "PI");

    exp =
        exp.replaceAll("pi", "PI");


    /* Power */

    exp =
        exp.replaceAll("^", "**");


    /* DEG/RAD functions */

    const toRadians =
        degrees =>
            degrees * Math.PI / 180;


    const toDegrees =
        radians =>
            radians * 180 / Math.PI;


    function sin(x) {

        return angleMode === "DEG"
            ? Math.sin(toRadians(x))
            : Math.sin(x);
    }


    function cos(x) {

        return angleMode === "DEG"
            ? Math.cos(toRadians(x))
            : Math.cos(x);
    }


    function tan(x) {

        return angleMode === "DEG"
            ? Math.tan(toRadians(x))
            : Math.tan(x);
    }


    function asin(x) {

        if (x < -1 || x > 1) {
            throw new Error(
                "sin⁻¹ domain is -1 to 1"
            );
        }

        const value =
            Math.asin(x);

        return angleMode === "DEG"
            ? toDegrees(value)
            : value;
    }


    function acos(x) {

        if (x < -1 || x > 1) {
            throw new Error(
                "cos⁻¹ domain is -1 to 1"
            );
        }

        const value =
            Math.acos(x);

        return angleMode === "DEG"
            ? toDegrees(value)
            : value;
    }


    function atan(x) {

        const value =
            Math.atan(x);

        return angleMode === "DEG"
            ? toDegrees(value)
            : value;
    }


    /* Other scientific functions */

    function sqrt(x) {

        if (x < 0) {
            throw new Error(
                "Cannot calculate √ of a negative number"
            );
        }

        return Math.sqrt(x);
    }


    function log(x) {

        if (x <= 0) {
            throw new Error(
                "log requires a positive number"
            );
        }

        return Math.log10(x);
    }


    function ln(x) {

        if (x <= 0) {
            throw new Error(
                "ln requires a positive number"
            );
        }

        return Math.log(x);
    }


    /* Average */

    function avg(...numbers) {

        if (numbers.length === 0) {
            throw new Error(
                "Enter numbers for average"
            );
        }

        if (
            numbers.some(
                number =>
                    typeof number !== "number" ||
                    !Number.isFinite(number)
            )
        ) {
            throw new Error(
                "Invalid average values"
            );
        }

        return (
            numbers.reduce(
                (sum, number) =>
                    sum + number,
                0
            ) / numbers.length
        );
    }


    /*
       IMPORTANT:
       The function names below match the
       arguments used in new Function().
    */

    const calculate =
        new Function(
            "sin",
            "cos",
            "tan",
            "asin",
            "acos",
            "atan",
            "sqrt",
            "log",
            "ln",
            "avg",
            "PI",
            "e",

            `"use strict"; return (${exp});`
        );


    const value =
        calculate(
            sin,
            cos,
            tan,
            asin,
            acos,
            atan,
            sqrt,
            log,
            ln,
            avg,
            Math.PI,
            Math.E
        );


    if (
        typeof value !== "number" ||
        !Number.isFinite(value)
    ) {
        throw new Error(
            "Invalid mathematical result"
        );
    }


    return value;
}


/* =========================
   FORMAT NUMBER
========================= */

function formatNumber(number) {

    if (
        Math.abs(number) < 1e-12
    ) {
        number = 0;
    }


    if (
        Number.isInteger(number)
    ) {
        return number.toLocaleString(
            "en-US"
        );
    }


    return Number(
        number.toPrecision(12)
    ).toLocaleString(
        "en-US",
        {
            maximumFractionDigits: 12
        }
    );
}


/* =========================
   CALCULATE
========================= */

function calculateResult() {

    if (!currentInput) {
        return;
    }


    try {

        const expression =
            currentInput;


        const value =
            evaluateExpression(
                expression
            );


        const formatted =
            formatNumber(value);


        expressionDisplay.textContent =
            expression
                .replaceAll("*", "×")
                .replaceAll("/", "÷")
                .replaceAll("^", "ʸ");


        resultDisplay.textContent =
            formatted;


        addHistory(
            expression,
            formatted
        );


        currentInput =
            String(value);

    } catch (error) {

        resultDisplay.textContent =
            "Error";

        showToast(
            error.message ||
            "Invalid calculation"
        );
    }
}


/* =========================
   HISTORY
========================= */

function addHistory(
    expression,
    result
) {

    history.unshift({
        expression,
        result,
        time: Date.now()
    });


    history =
        history.slice(0, 30);


    localStorage.setItem(
        "novaHistory",
        JSON.stringify(history)
    );


    renderHistory();
}


function renderHistory() {

    historyList.innerHTML = "";


    if (history.length === 0) {

        historyList.innerHTML =
            `<p class="empty-history">
                No calculations yet.
            </p>`;

        return;
    }


    history.forEach(
        (item, index) => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "history-item";


            div.innerHTML = `
                <div class="history-expression">
                    ${escapeHTML(
                        item.expression
                    )}
                </div>

                <div class="history-result">
                    = ${escapeHTML(
                        item.result
                    )}
                </div>
            `;


            div.addEventListener(
                "click",
                () => {

                    currentInput =
                        item.expression;

                    updateDisplay();

                    historyPanel.classList.add(
                        "hidden"
                    );

                    showToast(
                        "Calculation loaded"
                    );
                }
            );


            historyList.appendChild(div);
        }
    );
}


function clearHistory() {

    history = [];

    localStorage.removeItem(
        "novaHistory"
    );

    renderHistory();

    showToast(
        "History cleared"
    );
}


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================
   MODE SWITCH
========================= */

function showBasicMode() {

    basicPad.classList.remove(
        "hidden"
    );

    scientificPad.classList.add(
        "hidden"
    );


    basicModeBtn.classList.add(
        "active"
    );

    scientificModeBtn.classList.remove(
        "active"
    );
}


function showScientificMode() {

    scientificPad.classList.remove(
        "hidden"
    );

    basicPad.classList.add(
        "hidden"
    );


    scientificModeBtn.classList.add(
        "active"
    );

    basicModeBtn.classList.remove(
        "active"
    );
}


/* =========================
   ANGLE MODE
========================= */

function toggleAngle() {

    angleMode =
        angleMode === "DEG"
            ? "RAD"
            : "DEG";


    localStorage.setItem(
        "novaAngleMode",
        angleMode
    );


    updateDisplay();

    showToast(
        `Angle mode: ${angleMode}`
    );
}


/* =========================
   MEMORY
========================= */

function getCurrentNumber() {

    try {

        if (!currentInput) {
            return 0;
        }

        return evaluateExpression(
            currentInput
        );

    } catch {

        return 0;
    }
}


function memoryClear() {

    memory = 0;

    localStorage.setItem(
        "novaMemory",
        memory
    );

    showToast(
        "Memory cleared"
    );
}


function memoryRecall() {

    currentInput =
        String(memory);

    updateDisplay();

    showToast(
        "Memory recalled"
    );
}


function memoryAdd() {

    memory +=
        getCurrentNumber();


    localStorage.setItem(
        "novaMemory",
        memory
    );


    showToast(
        "Added to memory"
    );
}


function memorySubtract() {

    memory -=
        getCurrentNumber();


    localStorage.setItem(
        "novaMemory",
        memory
    );


    showToast(
        "Subtracted from memory"
    );
}


/* =========================
   BUTTON EVENTS
========================= */

document
    .querySelectorAll(
        ".button-pad button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const value =
                    button.dataset.value;

                const action =
                    button.dataset.action;


                if (action === "clear") {

                    clearCalculator();

                    return;
                }


                if (action === "delete") {

                    deleteLast();

                    return;
                }


                if (action === "calculate") {

                    calculateResult();

                    return;
                }


                if (action === "square") {

                    squareCurrent();

                    return;
                }


                if (value !== undefined) {

                    appendValue(value);
                }

            }
        );

    });


/* =========================
   MEMORY EVENTS
========================= */

document
    .querySelectorAll(
        "[data-memory]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const action =
                    button.dataset.memory;


                if (action === "clear") {
                    memoryClear();
                }

                if (action === "recall") {
                    memoryRecall();
                }

                if (action === "add") {
                    memoryAdd();
                }

                if (action === "subtract") {
                    memorySubtract();
                }

            }
        );

    });


/* =========================
   MODE EVENTS
========================= */

basicModeBtn.addEventListener(
    "click",
    showBasicMode
);

scientificModeBtn.addEventListener(
    "click",
    showScientificMode
);


/* =========================
   ANGLE EVENT
========================= */

angleBtn.addEventListener(
    "click",
    toggleAngle
);


/* =========================
   HISTORY EVENTS
========================= */

historyToggleBtn.addEventListener(
    "click",
    () => {

        historyPanel.classList.toggle(
            "hidden"
        );

        renderHistory();
    }
);


clearHistoryBtn.addEventListener(
    "click",
    clearHistory
);


/* =========================
   COPY RESULT
========================= */

copyBtn.addEventListener(
    "click",
    async () => {

        const text =
            resultDisplay.textContent;


        if (
            !text ||
            text === "Error" ||
            text === "0"
        ) {
            showToast(
                "Nothing to copy"
            );

            return;
        }


        try {

            await navigator.clipboard.writeText(
                text.replaceAll(",", "")
            );

            showToast(
                "Result copied!"
            );

        } catch {

            showToast(
                "Copy failed"
            );
        }

    }
);


/* =========================
   THEME
========================= */

function loadTheme() {

    const savedTheme =
        localStorage.getItem(
            "novaTheme"
        );


    if (savedTheme === "dark") {

        document.body.classList.add(
            "dark"
        );

        themeBtn.textContent = "☀️";

    } else {

        document.body.classList.remove(
            "dark"
        );

        themeBtn.textContent = "🌙";
    }
}


themeBtn.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark"
        );


        const isDark =
            document.body.classList.contains(
                "dark"
            );


        localStorage.setItem(
            "novaTheme",
            isDark
                ? "dark"
                : "light"
        );


        themeBtn.textContent =
            isDark
                ? "☀️"
                : "🌙";
    }
);


/* =========================
   KEYBOARD SUPPORT
========================= */

document.addEventListener(
    "keydown",
    event => {

        const key =
            event.key;


        if (
            /^[0-9.]$/.test(key)
        ) {

            appendValue(key);

            return;
        }


        if (
            ["+", "-", "*", "/", "(", ")", "^", "%"]
                .includes(key)
        ) {

            appendValue(key);

            return;
        }


        if (key === "Enter" || key === "=") {

            event.preventDefault();

            calculateResult();

            return;
        }


        if (
            key === "Backspace"
        ) {

            deleteLast();

            return;
        }


        if (key === "Escape") {

            clearCalculator();

            return;
        }

    }
);


/* =========================
   INITIALIZE
========================= */

loadTheme();

renderHistory();

updateDisplay();

showBasicMode();