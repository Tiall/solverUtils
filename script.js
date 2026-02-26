function updateInputLabels() {
    let inputType = document.getElementById('inputType').value;
    let termsLabel = document.getElementById(inputType + 'Label'); // Get the label corresponding to the selected input type
    // Hide all labels first
    document.querySelectorAll('label[for$="terms"]').forEach(label => {
        label.style.display = 'none';
    });

    termsLabel.style.display = 'inline'; // Show the label for the selected input type

    // Update placeholder text for input field based on selected input type
    let termsInput = document.getElementById('terms');
    if (inputType === 'expression') {
        termsInput.placeholder = "ex: a'*b + a*b'";
    }
    else {
        termsInput.placeholder = "ex: 0,1,2,5,6,7";
    }
}

// Handle form submission to solve the K-map based on user input
function solveKmap() {
    console.log("Clearing previous K-map results...");
    clearKmaps(); // Clear previous K-map results before displaying new ones

    console.log("Displaying K-map...");
    let numVariables = parseInt(document.getElementById('numVariables').value);
    let inputType = document.getElementById('inputType').value;
    let termsInput = document.getElementById('terms').value.trim().split(',');
    let dontCaresInput = document.getElementById('dontCares').value.trim().split(',');

    let kmapTable = document.getElementById(numVariables + 'InKmapTable');
    fillKmapVisual(kmapTable, inputType, termsInput, dontCaresInput);

    console.log("Solving K-map...");
    // Do the actual K-map solving logic here
}

// Fill the K-map table visual based on the provided minterms/maxterms and don't care conditions
function fillKmapVisual(kmapTable, inputType, terms, dontCares) {
    let rows = kmapTable.querySelectorAll('.data-row');

    // Handle postfix parsing if the input type is a boolean expression
    let postfixExpression = "";
    let variableValues = {}; 
    if (inputType === 'expression') {
        postfixExpression = parseBooleanExpression(terms[0]); // Parse the boolean expression from the input
        console.log(`Parsed boolean expression in postfix notation: ${postfixExpression}`);

        // Extract variable names from the postfix expression and initialize their values to 0
        postfixExpression.forEach(token => {
            if (/[A-Za-z]/.test(token)) { // Check if the token is a variable (e.g., A, B, C)
                variableValues[token] = 0; // Initialize variable values to 0 (will be set based on cell position later)
            }
        });
    }

    // Traverse each cell in the K-map and fill it based on whether its corresponding minterm/maxterm is in the provided list, or if it's a don't care condition
    rows.forEach(row => {
        let rowClass = row.classList[0]; // e.g., "~c~d"

        let dataCells = row.querySelectorAll('td');
        dataCells.forEach(cell => {
            let cellClass = cell.className; // e.g., "~a~b"
            let cellBinary = classStringToBinary(cellClass, rowClass); // e.g., "0000"

            let cellNum = binaryToNum(cellBinary).toString(); // Convert binary string to number (e.g., "0000" -> 0)
            let inTerms = terms.includes(cellNum); // Is the cell number in the minterms/maxterms list?
            
            // Check if the cell number is in the don't care conditions
            if (!inTerms && dontCares.includes(cellNum)) {
                cell.textContent = 'd'; // Mark don't care conditions with 'd'
                return; // Skip further processing for don't care cells
            }

            // Fill in final results
            if (inputType === 'minterms') {
                cell.textContent = inTerms ? '1' : '0'; // Fill cell with '1' or '0' based on minterms
            }
            else if (inputType === 'maxterms') {
                cell.textContent = inTerms ? '0' : '1'; // Fill cell with '1' or '0' based on maxterms
            }
            else if (inputType === 'expression') {
                // Set variable values based on the cell's binary representation (e.g., a=0, b=0 for "00")
                for (let variable in variableValues) {
                    // Get the offset to the correct variable bit in the cell's binary value  (using a=0, b=1, c=2, etc.)
                    let varIndex = variable.charCodeAt(0) - 'a'.charCodeAt(0); // Calculate index based on variable name (e.g., A=0, B=1)
                    // Set variable value based on corresponding bit in the binary string
                    variableValues[variable] = parseInt(cellBinary[varIndex]); 
                }

                // Get final result using the cells variable values 
                cell.textContent = evaluateBooleanExpression(postfixExpression, variableValues); // Evaluate the boolean expression for the current cell and fill it with the result ('1' or '0')
                console.log(`Evaluating cell ${cellBinary} with variables ${JSON.stringify(variableValues)}: ${cell.textContent}`);
            }
        });
    });
}

// Convert html element class strings to binary representation (e.g., "~c~d" + "~a~b" -> "0000")
function classStringToBinary(rowClass, cellClass) {
    let result = "";
    for (let i = 0; i < rowClass.length; i++) {
        if (rowClass[i] === '~') {
            result += '0';
            i++; // Skip the next character (the variable name)
        }
        else {
            result += '1';
        }
    }
    for (let j = 0; j < cellClass.length; j++) {
        if (cellClass[j] === '~') {
            result += '0';
            j++; // Skip the next character (the variable name)
        }
        else {
            result += '1';
        }
    }
    return result; // Return the combined binary string
}


function clearKmaps() {
    for (let i = 2; i <= 4; i++) {
        document.getElementById(i + 'InKmapTable');
        let rows = document.getElementById(i + 'InKmapTable').querySelectorAll('.data-row');
        rows.forEach(row => {
            let cells = row.querySelectorAll('td');
            cells.forEach(cell => {
                cell.textContent = ''; // Clear the content of each cell
            });
        });
    }
}

// Define operator precedence for the Shunting Yard algorithm
function precedence(operator) {
    switch (operator) {
        case "\'": // NOT
            return 3;
        case '*': // AND
            return 2;
        case '+': // OR
            return 1;
        case '^': // XOR
            return 1;
        default:
            return 0;
    }
}
// Takes a boolean expression as a string (e.g., "A'B + AB'") and converts it to postfix notation using the Shunting Yard algorithm
function parseBooleanExpression(expressionString) {
    // Implement the Shunting Yard algorithm to convert the infix expression to postfix (Reverse Polish Notation)
    let outputQueue = [];
    let operatorStack = [];
    for (let i = 0; i < expressionString.length; i++) {
        let char = expressionString[i];
        switch (char) {
            case ' ':
                continue; // Skip whitespace
            case '+': // OR
            case '*': // AND
            case '^': // XOR
            case "\'": // Negation (NOT)
                // Handle normal operators and negation
                while (operatorStack.length > 0 && precedence(operatorStack[operatorStack.length - 1]) >= precedence(char)) {
                    outputQueue.push(operatorStack.pop());
                }
                operatorStack.push(char);
                break;
            case '(':
                operatorStack.push(char);
                break;
            case ')':
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
                    outputQueue.push(operatorStack.pop());
                }
                operatorStack.pop(); // Pop the '(' from the stack
                break;
            default:
                // Handle variables (e.g., A, B, C)
                outputQueue.push(char);
                break;
        }
    }
    // Push remaining operators to the output queue
    while (operatorStack.length > 0) {
        outputQueue.push(operatorStack.pop());
    }
    return outputQueue; // Return the expression in postfix notation for further evaluation
}
// Evaluate a boolean expression in postfix notation given the variable values (e.g., {A: 1, B: 0})
function evaluateBooleanExpression(postfixExpression, variableValues) {
    let stack = [];
    postfixExpression.forEach(token => {
        switch (token) {
            case '+': // OR
                var b = stack.pop();
                var a = stack.pop();
                stack.push(a | b);
                break;
            case '*': // AND
                var b = stack.pop();
                var a = stack.pop();
                stack.push(a & b);
                break;
            case '^': // XOR
                var b = stack.pop();
                var a = stack.pop();
                stack.push(a ^ b);
                break;
            case "\'": // NOT
                var a = stack.pop();
                stack.push(a ^ 1);
                break;
            default:
                // Handle variables (e.g., A, B, C)
                stack.push(variableValues[token] || 0); // Push the value of the variable (default to 0 if not provided)
                break;
        }
    });

    return stack.pop(); // The final result of the expression evaluation
}


var parsedExpression = []; // Global variable to store the parsed boolean expression in postfix notation for use in cell evaluation
function updateInputVariables(event) {
    console.log(`Updating input variables based on expression: ${event.target.value}`);
    let expression = event.target.value;

    // Parse the boolean expression to extract variables and prepare for evaluation
    parsedExpression = parseBooleanExpression(expression); // Parse the expression and convert it to a string for easier variable extraction
    

    document.getElementById('variableSection').innerHTML = ''; // Clear previous variable inputs

    // Extract unique variable names from the expression (e.g., A, B, C)
    let variables = new Set(parsedExpression.toString().match(/[A-Za-z]/g)); // Use regex to find all variable names


    // Create input fields for each variable
    variables.forEach(variable => {
        // Create a container div for the variable input
        let variableDiv = document.createElement('div');
        variableDiv.className = 'variable-input';

        // Create a label for the variable input
        let variableLabel = document.createElement('label');
        variableLabel.textContent = `${variable}: `;
        variableLabel.setAttribute('for', `var_${variable}`);

        // Create a number input for the variable (0 or 1)
        let variableInput = document.createElement('input');
        variableInput.type = 'number';
        variableInput.id = `var_${variable}`;
        variableInput.min = 0;
        variableInput.max = 1;
        variableInput.oninput = testBooleanExpression;

        // Append the label and input to the variable div
        variableDiv.appendChild(variableLabel);
        variableDiv.appendChild(variableInput);

        // Append the variable input to the variable section in the HTML
        document.getElementById('variableSection').appendChild(variableDiv);
    });
}

function testBooleanExpression() {
    // Gather variable values from the input fields
    let variableValues = {};
    let variableInputs = document.querySelectorAll('#variableSection input');
    variableInputs.forEach(input => {
        let variableName = input.id.replace('var_', ''); // Extract variable name from input ID
        variableValues[variableName] = parseInt(input.value) || 0; // Get the value of the variable (default to 0 if not provided)
    });

    // Evaluate the boolean expression using the parsed postfix expression and the variable values
    let result = evaluateBooleanExpression(parsedExpression, variableValues);
    
     // Display the result to the user
    document.getElementById('outputValue').textContent = result; // Show the output value in the HTML
}


// UTILITY FUNCTIONS ==========================================================
// Convert a number to its binary representation with leading zeros
function numToBinary(num, bitLength) {
    return num.toString(2).padStart(bitLength, '0');
}
// Convert a binary string to a number
function binaryToNum(binaryStr) {
    return parseInt(binaryStr, 2);
}