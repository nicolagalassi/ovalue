
function calcBuildCostLF(techID, techLevel, techData, costRdc) {
    if (techLevel < 1) return [0, 0, 0];
    var data = techData[techID];
    if (data === undefined) return [0, 0, 0];
    var cost = [0, 0, 0];
    costRdc = Math.min(0.99, costRdc);
    for (var i = 0; i < 3; i++)
        cost[i] = Math.floor((1 - costRdc) * Math.floor(data[i] * techLevel * Math.pow(data[5 + i], techLevel - 1)));
    return cost;
}

const techData = {
    4105: [25000, 20000, 10000, 0, 4500, 1.5, 1.5, 1.5, 0, 1.4]
};

const result = calcBuildCostLF(4105, 19, techData, 0);
console.log("Result Level 19 (costRdc=0):", result);

const expected = [701448975, 561159180, 280579590];
console.log("Expected:", expected);
console.log("Match:", result[0] === expected[0]);
