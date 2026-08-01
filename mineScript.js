const itemAmountDisplay = document.getElementById("itemAmountValue")
function onItemAmountChanged(e) {
    let itemAmountDict = solveAmount(e.target.value);

    // console.log("ResultDict: ", itemAmountDict);
    itemAmountDisplay.innerText = formatItemData(itemAmountDict);
}

function solveAmount(amount) {
    // The amount of just stacks that fit in the amount
    let rawStackCount = Math.trunc(amount / 64);

    // The amount of items remaining that are under a stack size
    let itemCount = amount % 64;

    // The amount of single chests/shulker boxes in the amount
    let boxCount = Math.trunc(rawStackCount / 27);

    // The amount of stacks remaining that are under a box size
    let stackCount = rawStackCount % 27;

    // The compiled dictionary of the findings
    let resultDict = {
        boxes: boxCount,
        rawStacks: rawStackCount,
        stacks: stackCount,
        items: itemCount
    };

    return resultDict;
}

function formatItemData(itemAmountDict) {
    let quantityAmounts = [];

    if (itemAmountDict.boxes > 0) { // We have some Boxes
        quantityAmounts.push(itemAmountDict.boxes + " box"+(itemAmountDict.boxes>1?"es":""));
    }
    if (itemAmountDict.stacks > 0) { // We have some stacks
        quantityAmounts.push(itemAmountDict.stacks + " stack"+(itemAmountDict.stacks>1?"s":""));
    }
    if (itemAmountDict.items > 0) { // We have some remaining items
        quantityAmounts.push(itemAmountDict.items + " item"+(itemAmountDict.items>1?"s":""));
    }
    
    

    let result = "";
    for (let i = 0; i < quantityAmounts.length; i++) {
        result += (quantityAmounts.length==2&&i!=0?" and ":(i==0?"":(i==quantityAmounts.length-1?", and ":", "))) + quantityAmounts[i];
    }

    result += "\n(";
    if (itemAmountDict.rawStacks > 0) { // We have some stacks
        result += (itemAmountDict.rawStacks + " stack"+(itemAmountDict.rawStacks>1?"s":""));
        if (itemAmountDict.items > 0) {
            result += " and ";
        }
    }
    if (itemAmountDict.items > 0) { // We have some remaining items
        result += (itemAmountDict.items + " item"+(itemAmountDict.items>1?"s":""));
    }
    result += ")";

    return result;
}