
function testIncremental(base, level, mult) {
    console.log(`--- Testing Incremental Base: ${base}, Level: ${level}, Mult: ${mult} ---`);
    let currentBase = base;
    for (let i = 2; i <= level; i++) {
        currentBase = Math.floor(currentBase * mult);
    }
    let res = currentBase * level;
    console.log(`Incremental single level ${level}:`, currentBase);
    console.log(`Final cost (currentBase * level):`, res);
}

testIncremental(25000, 19, 1.5);
console.log("Target:", 701448975);
