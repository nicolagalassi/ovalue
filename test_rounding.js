
function test(base, level, mult) {
    console.log(`--- Testing Base: ${base}, Level: ${level}, Mult: ${mult} ---`);
    
    // Standard Math.pow
    let res1 = Math.floor(base * level * Math.pow(mult, level - 1));
    console.log("Standard pow:", res1);
    
    // Rounding factor at 1.5 (as if it was 1.498...)
    // No, let's try precision of mult
    
    // What if level multiplication is outside the first floor? 
    // user formula: floor((1-0) * floor(base * level * pow(mult, level-1)))
    // This is what I did in res1.
    
    // Try: floor(base * pow(mult, level-1)) * level
    let res2 = Math.floor(base * Math.pow(mult, level - 1)) * level;
    console.log("floor(base * pow) * level:", res2);

    // Try: floor(base * level * floor(pow(mult, level-1) * 1000) / 1000)
    let res3 = Math.floor(base * level * (Math.floor(Math.pow(mult, level - 1) * 1000) / 1000));
    console.log("floor with 3 decimal pow:", res3);

    // Try: floor(base * level * floor(pow(mult, level-1) * 100) / 100)
    let res4 = Math.floor(base * level * (Math.floor(Math.pow(mult, level - 1) * 100) / 100));
    console.log("floor with 2 decimal pow:", res4);

    // Try intermediate floors for each power
    let p = 1;
    for(let i=0; i<level-1; i++) {
        p = p * mult;
    }
    let res5 = Math.floor(base * level * p);
    console.log("Manual power loop:", res5);

    let p6 = 1;
    for(let i=0; i<level-1; i++) {
        p6 = Math.floor(p6 * mult * 1000) / 1000;
    }
    let res6 = Math.floor(base * level * p6);
    console.log("Power loop with floor 1000:", res6);

}

test(25000, 19, 1.5);
console.log("Target:", 701448975);
