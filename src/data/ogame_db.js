// NOTA: In Vue/Vite dobbiamo usare "export const" davanti al nome
export const OGAME_DB = {
    resources: {
        type: 'building',
        items: {
            metal_mine: { cost: [60, 15, 0], factor: 1.5 },
            crystal_mine: { cost: [48, 24, 0], factor: 1.6 },
            deuterium_synthesizer: { cost: [225, 75, 0], factor: 1.5 },
            solar_plant: { cost: [75, 30, 0], factor: 1.5 },
            fusion_reactor: { cost: [900, 360, 180], factor: 1.8 },
            metal_storage: { cost: [1000, 0, 0], factor: 2 },
            crystal_storage: { cost: [1000, 500, 0], factor: 2 },
            deuterium_tank: { cost: [1000, 1000, 0], factor: 2 },
            solar_satellite: { cost: [0, 2000, 500], factor: 1, type: 'unit' }, // Solar Satellite is a unit, not a building
            crawler: { cost: [2000, 2000, 1000], factor: 1, type: 'unit' }
        }
    },
    facilities: {
        type: 'building',
        items: {
            robotics_factory: { cost: [400, 120, 200], factor: 2 },
            shipyard: { cost: [400, 200, 100], factor: 2 },
            research_lab: { cost: [200, 400, 200], factor: 2 },
            alliance_depot: { cost: [20000, 40000, 0], factor: 2 },
            missile_silo: { cost: [20000, 20000, 1000], factor: 2 },
            nanite_factory: { cost: [1000000, 500000, 100000], factor: 2 },
            terraformer: { cost: [0, 50000, 100000, 1000], factor: 2 }, // Last is Energy
            space_dock: { cost: [200, 0, 50, 50], factor: 5 }, // Energy is used for special logic in OGame but simplified here
            lunar_base: { cost: [20000, 40000, 20000], factor: 2 },
            sensor_phalanx: { cost: [20000, 40000, 20000], factor: 2 },
            jump_gate: { cost: [2000000, 4000000, 2000000], factor: 2 }
        }
    },
    research: {
        type: 'research',
        items: {
            energy_technology: { cost: [0, 800, 400], factor: 2 },
            laser_technology: { cost: [200, 100, 0], factor: 2 },
            ion_technology: { cost: [1000, 300, 100], factor: 2 },
            hyperspace_technology: { cost: [0, 4000, 2000], factor: 2 },
            plasma_technology: { cost: [2000, 4000, 1000], factor: 2 },
            combustion_drive: { cost: [400, 0, 600], factor: 2 },
            impulse_drive: { cost: [2000, 4000, 600], factor: 2 },
            hyperspace_drive: { cost: [10000, 20000, 6000], factor: 2 },
            espionage_technology: { cost: [200, 1000, 200], factor: 2 },
            computer_technology: { cost: [0, 400, 600], factor: 2 },
            astrophysics: { cost: [4000, 8000, 4000], factor: 1.75 },
            intergalactic_research_network: { cost: [240000, 400000, 160000], factor: 2 },
            graviton_technology: { cost: [0, 0, 0, 300000], factor: 3 },
            weapons_technology: { cost: [800, 200, 0], factor: 2 },
            shielding_technology: { cost: [200, 600, 0], factor: 2 },
            armor_technology: { cost: [1000, 0, 0], factor: 2 },
            mineralogy_centre: { cost: [10000, 10000, 5000], factor: 1.5, type: 'lf_research' }
        }
    },
    // LifeForms Data
    lf_humans: {
        type: 'lf_building',
        items: {
            1001: { cost: [7, 2, 0, 0], factors: [1.2, 1.2, 0, 0] },
            1002: { cost: [5, 2, 0, 8], factors: [1.23, 1.23, 0, 1.02] },
            1003: { cost: [20000, 25000, 10000, 10], factors: [1.3, 1.3, 1.3, 1.08] },
            1004: { cost: [5000, 3200, 1500, 15], factors: [1.7, 1.7, 1.7, 1.25] },
            1005: { cost: [50000, 40000, 50000, 30], factors: [1.7, 1.7, 1.7, 1.25] },
            1006: { cost: [9000, 6000, 3000, 40], factors: [1.5, 1.5, 1.5, 1.1] },
            1007: { cost: [25000, 13000, 7000, 0], factors: [1.09, 1.09, 1.09, 0] },
            1008: { cost: [50000, 25000, 15000, 80], factors: [1.5, 1.5, 1.5, 1.1] },
            1009: { cost: [75000, 20000, 25000, 50], factors: [1.09, 1.09, 1.09, 1.02] },
            1010: { cost: [150000, 30000, 15000, 60], factors: [1.12, 1.12, 1.12, 1.03] },
            1011: { cost: [80000, 35000, 60000, 90], factors: [1.5, 1.5, 1.5, 1.05] },
            1012: { cost: [250000, 125000, 125000, 100], factors: [1.15, 1.15, 1.15, 1.02] }
        }
    },
    lf_humans_res: {
        type: 'lf_research',
        items: {
            1101: { cost: [5000, 2500, 500, 0], factors: [1.3, 1.3, 1.3, 0] },
            1102: { cost: [7000, 10000, 5000, 0], factors: [1.5, 1.5, 1.5, 0] },
            1103: { cost: [15000, 10000, 5000, 0], factors: [1.3, 1.3, 1.3, 0] },
            1104: { cost: [20000, 15000, 7500, 0], factors: [1.3, 1.3, 1.3, 0] },
            1105: { cost: [24750, 19800, 9900, 0], factors: [1.3, 1.3, 1.3, 0] },
            1106: { cost: [35000, 25000, 15000, 0], factors: [1.5, 1.5, 1.5, 0] },
            1107: { cost: [70000, 40000, 20000, 0], factors: [1.3, 1.3, 1.3, 0] },
            1108: { cost: [80000, 50000, 20000, 0], factors: [1.5, 1.5, 1.5, 0] },
            1109: { cost: [320000, 240000, 100000, 0], factors: [1.5, 1.5, 1.5, 0] },
            1110: { cost: [320000, 240000, 100000, 0], factors: [1.5, 1.5, 1.5, 0] },
            1111: { cost: [120000, 30000, 25000, 0], factors: [1.5, 1.5, 1.5, 0] },
            1112: { cost: [100000, 40000, 30000, 0], factors: [1.3, 1.3, 1.3, 0] },
            1113: { cost: [200000, 100000, 100000, 0], factors: [1.3, 1.3, 1.3, 0] },
            1114: { cost: [160000, 120000, 50000, 0], factors: [1.5, 1.5, 1.5, 0] },
            1115: { cost: [160000, 120000, 50000, 0], factors: [1.5, 1.5, 1.5, 0] },
            1116: { cost: [320000, 240000, 100000, 0], factors: [1.5, 1.5, 1.5, 0] },
            1117: { cost: [300000, 180000, 120000, 0], factors: [1.5, 1.5, 1.5, 0] },
            1118: { cost: [500000, 300000, 200000, 0], factors: [1.3, 1.3, 1.3, 0] }
        }
    },
    lf_rocktal: {
        type: 'lf_building',
        items: {
            2001: { cost: [9, 3, 0, 0], factors: [1.2, 1.2, 0, 0] },
            2002: { cost: [7, 2, 0, 10], factors: [1.2, 1.2, 0, 1.03] },
            2003: { cost: [40000, 10000, 15000, 15], factors: [1.3, 1.3, 1.3, 1.1] },
            2004: { cost: [5000, 3800, 1000, 20], factors: [1.7, 1.7, 1.7, 1.35] },
            2005: { cost: [50000, 40000, 50000, 60], factors: [1.65, 1.65, 1.65, 1.3] },
            2006: { cost: [10000, 8000, 1000, 40], factors: [1.4, 1.4, 1.4, 1.1] },
            2007: { cost: [20000, 15000, 10000, 0], factors: [1.2, 1.2, 1.2, 0] },
            2008: { cost: [50000, 35000, 15000, 80], factors: [1.5, 1.5, 1.5, 1.3] },
            2009: { cost: [85000, 44000, 25000, 90], factors: [1.4, 1.4, 1.4, 1.1] },
            2010: { cost: [120000, 50000, 20000, 90], factors: [1.4, 1.4, 1.4, 1.1] },
            2011: { cost: [250000, 150000, 100000, 120], factors: [1.8, 1.8, 1.8, 1.3] },
            2012: { cost: [250000, 125000, 125000, 100], factors: [1.5, 1.5, 1.5, 1.1] }
        }
    },
    lf_rocktal_res: {
        type: 'lf_research',
        items: {
            2101: { cost: [10000, 6000, 1000, 0], factors: [1.5, 1.5, 1.5, 0] },
            2102: { cost: [7500, 12500, 5000, 0], factors: [1.5, 1.5, 1.5, 0] },
            2103: { cost: [15000, 10000, 5000, 0], factors: [1.5, 1.5, 1.5, 0] },
            2104: { cost: [20000, 15000, 7500, 0], factors: [1.3, 1.3, 1.3, 0] },
            2105: { cost: [25000, 20000, 10000, 0], factors: [1.5, 1.5, 1.5, 0] },
            2106: { cost: [50000, 50000, 20000, 0], factors: [1.5, 1.5, 1.5, 0] },
            2107: { cost: [70000, 40000, 20000, 0], factors: [1.5, 1.5, 1.5, 0] },
            2108: { cost: [160000, 120000, 50000, 0], factors: [1.5, 1.5, 1.5, 0] },
            2109: { cost: [75000, 55000, 25000, 0], factors: [1.5, 1.5, 1.5, 0] },
            2110: { cost: [85000, 40000, 35000, 0], factors: [1.5, 1.5, 1.5, 0] },
            2111: { cost: [120000, 30000, 25000, 0], factors: [1.5, 1.5, 1.5, 0] },
            2112: { cost: [100000, 40000, 30000, 0], factors: [1.5, 1.5, 1.5, 0] },
            2113: { cost: [200000, 100000, 100000, 0], factors: [1.2, 1.2, 1.2, 0] },
            2114: { cost: [220000, 110000, 110000, 0], factors: [1.3, 1.3, 1.3, 0] },
            2115: { cost: [240000, 120000, 120000, 0], factors: [1.3, 1.3, 1.3, 0] },
            2116: { cost: [250000, 250000, 250000, 0], factors: [1.4, 1.4, 1.4, 0] },
            2117: { cost: [500000, 300000, 200000, 0], factors: [1.5, 1.5, 1.5, 0] },
            2118: { cost: [300000, 180000, 120000, 0], factors: [1.7, 1.7, 1.7, 0] }
        }
    },
    lf_mecha: {
        type: 'lf_building',
        items: {
            3001: { cost: [6, 2, 0, 0], factors: [1.21, 1.21, 0, 0] },
            3002: { cost: [5, 2, 0, 8], factors: [1.18, 1.18, 0, 1.02] },
            3003: { cost: [30000, 20000, 10000, 13], factors: [1.3, 1.3, 1.3, 1.08] },
            3004: { cost: [5000, 3800, 1000, 10], factors: [1.8, 1.8, 1.8, 1.2] },
            3005: { cost: [50000, 40000, 50000, 40], factors: [1.8, 1.8, 1.8, 1.2] },
            3006: { cost: [7500, 7000, 1000, 0], factors: [1.3, 1.3, 1.3, 0] },
            3007: { cost: [35000, 15000, 10000, 40], factors: [1.5, 1.5, 1.5, 1.05] },
            3008: { cost: [50000, 20000, 30000, 40], factors: [1.07, 1.07, 1.07, 1.01] },
            3009: { cost: [100000, 10000, 3000, 80], factors: [1.14, 1.14, 1.14, 1.04] },
            3010: { cost: [100000, 40000, 20000, 60], factors: [1.5, 1.5, 1.5, 1.1] },
            3011: { cost: [55000, 50000, 30000, 70], factors: [1.5, 1.5, 1.5, 1.05] },
            3012: { cost: [250000, 125000, 125000, 100], factors: [1.4, 1.4, 1.4, 1.05] }
        }
    },
    lf_mecha_res: {
        type: 'lf_research',
        items: {
            3101: { cost: [10000, 6000, 1000, 0], factors: [1.5, 1.5, 1.5, 0] },
            3102: { cost: [7500, 12500, 5000, 0], factors: [1.3, 1.3, 1.3, 0] },
            3103: { cost: [15000, 10000, 5000, 0], factors: [1.5, 1.5, 1.5, 0] },
            3104: { cost: [20000, 15000, 7500, 0], factors: [1.3, 1.3, 1.3, 0] },
            3105: { cost: [160000, 120000, 50000, 0], factors: [1.5, 1.5, 1.5, 0] },
            3106: { cost: [50000, 50000, 20000, 0], factors: [1.5, 1.5, 1.5, 0] },
            3107: { cost: [70000, 40000, 20000, 0], factors: [1.3, 1.3, 1.3, 0] },
            3108: { cost: [160000, 120000, 50000, 0], factors: [1.5, 1.5, 1.5, 0] },
            3109: { cost: [160000, 120000, 50000, 0], factors: [1.5, 1.5, 1.5, 0] },
            3110: { cost: [85000, 40000, 35000, 0], factors: [1.2, 1.2, 1.2, 0] },
            3111: { cost: [120000, 30000, 25000, 0], factors: [1.3, 1.3, 1.3, 0] },
            3112: { cost: [160000, 120000, 50000, 0], factors: [1.5, 1.5, 1.5, 0] },
            3113: { cost: [200000, 100000, 100000, 0], factors: [1.5, 1.5, 1.5, 0] },
            3114: { cost: [160000, 120000, 50000, 0], factors: [1.5, 1.5, 1.5, 0] },
            3115: { cost: [320000, 240000, 100000, 0], factors: [1.5, 1.5, 1.5, 0] },
            3116: { cost: [320000, 240000, 100000, 0], factors: [1.5, 1.5, 1.5, 0] },
            3117: { cost: [500000, 300000, 200000, 0], factors: [1.5, 1.5, 1.5, 0] },
            3118: { cost: [300000, 180000, 120000, 0], factors: [1.7, 1.7, 1.7, 0] }
        }
    },
    lf_kaelesh: {
        type: 'lf_building',
        items: {
            4001: { cost: [4, 3, 0, 0], factors: [1.21, 1.21, 0, 0] },
            4002: { cost: [6, 3, 0, 9], factors: [1.2, 1.2, 0, 1.02] },
            4003: { cost: [20000, 15000, 15000, 10], factors: [1.3, 1.3, 1.3, 1.08] },
            4004: { cost: [7500, 5000, 800, 15], factors: [1.8, 1.8, 1.8, 1.3] },
            4005: { cost: [60000, 30000, 50000, 30], factors: [1.8, 1.8, 1.8, 1.3] },
            4006: { cost: [8500, 5000, 3000, 0], factors: [1.25, 1.25, 1.25, 0] },
            4007: { cost: [15000, 15000, 5000, 0], factors: [1.2, 1.2, 1.2, 0] },
            4008: { cost: [75000, 25000, 30000, 30], factors: [1.05, 1.05, 1.05, 1.03] },
            4009: { cost: [87500, 25000, 30000, 40], factors: [1.2, 1.2, 1.2, 1.02] },
            4010: { cost: [150000, 30000, 30000, 140], factors: [1.4, 1.4, 1.4, 1.05] },
            4011: { cost: [75000, 50000, 55000, 90], factors: [1.2, 1.2, 1.2, 1.04] },
            4012: { cost: [500000, 250000, 250000, 100], factors: [1.4, 1.4, 1.4, 1.05] }
        }
    },
    lf_kaelesh_res: {
        type: 'lf_research',
        items: {
            4101: { cost: [10000, 6000, 1000, 0], factors: [1.5, 1.5, 1.5, 0] },
            4102: { cost: [7500, 12500, 5000, 0], factors: [1.5, 1.5, 1.5, 0] },
            4103: { cost: [15000, 10000, 5000, 0], factors: [1.5, 1.5, 1.5, 0] },
            4104: { cost: [20000, 15000, 7500, 0], factors: [1.5, 1.5, 1.5, 0] },
            4105: { cost: [25000, 20000, 10000, 0], factors: [1.5, 1.5, 1.5, 0] },
            4106: { cost: [50000, 50000, 20000, 0], factors: [1.3, 1.3, 1.3, 0] },
            4107: { cost: [70000, 40000, 20000, 0], factors: [1.5, 1.5, 1.5, 0] },
            4108: { cost: [80000, 50000, 20000, 0], factors: [1.2, 1.2, 1.2, 0] },
            4109: { cost: [320000, 240000, 100000, 0], factors: [1.5, 1.5, 1.5, 0] },
            4110: { cost: [85000, 40000, 35000, 0], factors: [1.2, 1.2, 1.2, 0] },
            4111: { cost: [120000, 30000, 25000, 0], factors: [1.5, 1.5, 1.5, 0] },
            4112: { cost: [100000, 40000, 30000, 0], factors: [1.5, 1.5, 1.5, 0] },
            4113: { cost: [200000, 100000, 100000, 0], factors: [1.5, 1.5, 1.5, 0] },
            4114: { cost: [160000, 120000, 50000, 0], factors: [1.5, 1.5, 1.5, 0] },
            4115: { cost: [240000, 120000, 120000, 0], factors: [1.5, 1.5, 1.5, 0] },
            4116: { cost: [320000, 240000, 100000, 0], factors: [1.5, 1.5, 1.5, 0] },
            4117: { cost: [500000, 300000, 200000, 0], factors: [1.5, 1.5, 1.5, 0] },
            4118: { cost: [300000, 180000, 120000, 0], factors: [1.7, 1.7, 1.7, 0] }
        }
    },

    "fleet": {
        "items": {
            "small_cargo": { "b": [2000, 2000, 0], "f": 1, "type": "unit" },
            "large_cargo": { "b": [6000, 6000, 0], "f": 1, "type": "unit" },
            "light_fighter": { "b": [3000, 1000, 0], "f": 1, "type": "unit" },
            "heavy_fighter": { "b": [6000, 4000, 0], "f": 1, "type": "unit" },
            "cruiser": { "b": [20000, 7000, 2000], "f": 1, "type": "unit" },
            "battleship": { "b": [45000, 15000, 0], "f": 1, "type": "unit" },
            "colony_ship": { "b": [10000, 20000, 10000], "f": 1, "type": "unit" },
            "recycler": { "b": [10000, 6000, 2000], "f": 1, "type": "unit" },
            "espionage_probe": { "b": [0, 1000, 0], "f": 1, "type": "unit" },
            "bomber": { "b": [50000, 25000, 15000], "f": 1, "type": "unit" },
            "destroyer": { "b": [60000, 50000, 15000], "f": 1, "type": "unit" },
            "deathstar": { "b": [5000000, 4000000, 1000000], "f": 1, "type": "unit" },
            "battlecruiser": { "b": [30000, 40000, 15000], "f": 1, "type": "unit" },
            "reaper": { "b": [85000, 55000, 20000], "f": 1, "type": "unit" },
            "pathfinder": { "b": [8000, 15000, 8000], "f": 1, "type": "unit" },
            "rocket_launcher": { "b": [2000, 0, 0], "f": 1, "type": "unit" },
            "light_laser": { "b": [1500, 500, 0], "f": 1, "type": "unit" },
            "heavy_laser": { "b": [6000, 2000, 0], "f": 1, "type": "unit" },
            "gauss_cannon": { "b": [20000, 15000, 2000], "f": 1, "type": "unit" },
            "ion_cannon": { "b": [2000, 6000, 0], "f": 1, "type": "unit" },
            "plasma_turret": { "b": [50000, 50000, 30000], "f": 1, "type": "unit" },
            "small_shield_dome": { "b": [10000, 10000, 0], "f": 1, "type": "unit" },
            "large_shield_dome": { "b": [50000, 50000, 0], "f": 1, "type": "unit" },
            "interplanetary_missile": { "b": [12500, 2500, 10000], "f": 1, "type": "unit" },
            "antiballistic_missile": { "b": [8000, 0, 2000], "f": 1, "type": "unit" }
        }
    },
    premium_items_legacy: {
        items: {
            metal_booster_bronze: { cost: 2500, type: "booster" },
            metal_booster_silver: { cost: 8500, type: "booster" },
            metal_booster_gold: { cost: 25000, type: "booster" },
            crystal_booster_bronze: { cost: 2500, type: "booster" },
            crystal_booster_silver: { cost: 8500, type: "booster" },
            crystal_booster_gold: { cost: 25000, type: "booster" },
            deut_booster_bronze: { cost: 2500, type: "booster" },
            deut_booster_silver: { cost: 8500, type: "booster" },
            deut_booster_gold: { cost: 25000, type: "booster" },
            kraken_bronze: { cost: 2500, type: "reducer" },
            kraken_silver: { cost: 8500, type: "reducer" },
            kraken_gold: { cost: 25000, type: "reducer" },
            detroid_bronze: { cost: 2500, type: "reducer" },
            detroid_silver: { cost: 8500, type: "reducer" },
            detroid_gold: { cost: 25000, type: "reducer" },
            newtron_bronze: { cost: 2500, type: "reducer" },
            newtron_silver: { cost: 8500, type: "reducer" },
            newtron_gold: { cost: 25000, type: "reducer" }
        }
    }
};

export const SHOP_ITEMS = {
    categories: [
        { id: "resources", name: "shop_cat_resources" },
        { id: "officers", name: "shop_cat_officers" },
        { id: "boosters_res", name: "shop_cat_boosters_res" },
        { id: "boosters_energy", name: "shop_cat_boosters_energy" },
        { id: "slots", name: "shop_cat_slots" },
        { id: "fields", name: "shop_cat_fields" },
        { id: "items", name: "shop_cat_items" }
    ],
    durations: [
        { id: "base", name: "dur_base" },
        { id: "7d", name: "dur_7d" },
        { id: "30d", name: "dur_30d" },
        { id: "90d", name: "dur_90d" }
    ],
    items: {
        // Resources
        "res_package_all": { cat: "resources", tier: "none", costs: { "none": { "base": 360000 } } },
        "res_package_deut": { cat: "resources", tier: "none", costs: { "none": { "base": 180000 } } },
        "res_package_crystal": { cat: "resources", tier: "none", costs: { "none": { "base": 120000 } } },
        "res_package_metal": { cat: "resources", tier: "none", costs: { "none": { "base": 60000 } } },
        
        // Officers & Classes
        "class_collector": { cat: "officers", tier: "none", costs: { "none": { "base": 500000 } } },
        "class_general": { cat: "officers", tier: "none", costs: { "none": { "base": 500000 } } },
        "class_discoverer": { cat: "officers", tier: "none", costs: { "none": { "base": 500000 } } },
        "staff_researcher": { cat: "officers", tier: "none", costs: { "none": { "base": 500000 } } },
        "staff_merchant": { cat: "officers", tier: "none", costs: { "none": { "base": 500000 } } },
        "staff_warrior": { cat: "officers", tier: "none", costs: { "none": { "base": 500000 } } },
        "officer_commander": { cat: "officers", tier: "none", costs: { "none": { "7d": 10000, "90d": 100000 } } },
        "officer_admiral": { cat: "officers", tier: "none", costs: { "none": { "7d": 5000, "90d": 50000 } } },
        "officer_engineer": { cat: "officers", tier: "none", costs: { "none": { "7d": 5000, "90d": 50000 } } },
        "officer_geologist": { cat: "officers", tier: "none", costs: { "none": { "7d": 12500, "90d": 125000 } } },
        "officer_technocrat": { cat: "officers", tier: "none", costs: { "none": { "7d": 10000, "90d": 100000 } } },
        "staff_command": { cat: "officers", tier: "none", costs: { "none": { "7d": 42500, "90d": 425000 } } },

        // Resource Boosters
        "booster_metal": { cat: "boosters_res", tier: "multi", costs: {
            "platinum": { "7d": 27000, "30d": 93500, "90d": 240000 },
            "gold": { "7d": 18000, "30d": 63750, "90d": 160000 },
            "silver": { "7d": 6750, "30d": 23800, "90d": 64000 },
            "bronze": { "7d": 2500, "30d": 8500, "90d": 25000 }
        }},
        "booster_crystal": { cat: "boosters_res", tier: "multi", costs: {
            "platinum": { "7d": 27000, "30d": 93500, "90d": 240000 },
            "gold": { "7d": 18000, "30d": 63750, "90d": 160000 },
            "silver": { "7d": 6750, "30d": 23800, "90d": 64000 },
            "bronze": { "7d": 2500, "30d": 8500, "90d": 25000 }
        }},
        "booster_deut": { cat: "boosters_res", tier: "multi", costs: {
            "platinum": { "7d": 27000, "30d": 93500, "90d": 240000 },
            "gold": { "7d": 18000, "30d": 63750, "90d": 160000 },
            "silver": { "7d": 6750, "30d": 23800, "90d": 64000 },
            "bronze": { "7d": 2500, "30d": 8500, "90d": 25000 }
        }},

        // Energy Amplifiers
        "booster_energy": { cat: "boosters_energy", tier: "multi", costs: {
            "platinum": { "7d": 27000, "30d": 93500, "90d": 240000 },
            "gold": { "7d": 18000, "30d": 63750, "90d": 160000 },
            "silver": { "7d": 6750, "30d": 23800, "90d": 64000 },
            "bronze": { "7d": 2500, "30d": 8500, "90d": 25000 }
        }},

        // Planet Fields
        "fields_planet": { cat: "fields", tier: "multi", costs: {
            "platinum": { "base": 350000 },
            "gold": { "base": 300000 },
            "silver": { "base": 150000 },
            "bronze": { "base": 75000 }
        }},

        // Moon Fields
        "fields_moon": { cat: "fields", tier: "multi", costs: {
            "platinum": { "base": 130000 },
            "gold": { "base": 100000 },
            "silver": { "base": 50000 },
            "bronze": { "base": 30000 }
        }},

        // Items (M.O.O.N.S, Reducers)
        "moons": { cat: "items", tier: "multi", costs: {
            "gold": { "base": 100000 },
            "silver": { "base": 50000 },
            "bronze": { "base": 30000 }
        }},
        "kraken": { cat: "items", tier: "multi", costs: {
            "gold": { "base": 25000 },
            "silver": { "base": 8500 },
            "bronze": { "base": 2500 }
        }},
        "detroid": { cat: "items", tier: "multi", costs: {
            "gold": { "base": 25000 },
            "silver": { "base": 8500 },
            "bronze": { "base": 2500 }
        }},
        "newtron": { cat: "items", tier: "multi", costs: {
            "gold": { "base": 25000 },
            "silver": { "base": 8500 },
            "bronze": { "base": 2500 }
        }},

        // Expedition Slots
        "slot_expedition": { cat: "slots", tier: "multi", costs: {
            "gold": { "7d": 40500, "30d": 143437, "90d": 378000 },
            "silver": { "7d": 27000, "30d": 95625, "90d": 252000 },
            "bronze": { "7d": 13500, "30d": 47812, "90d": 126000 }
        }},

        // Fleet Slots
        "slot_fleet": { cat: "slots", tier: "multi", costs: {
            "gold": { "7d": 13500, "30d": 47812, "90d": 126000 },
            "silver": { "7d": 9000, "30d": 31875, "90d": 84000 },
            "bronze": { "7d": 4500, "30d": 15937, "90d": 42000 }
        }},

        // Avatars
        "avatar_lasercat": { cat: "avatars", tier: "none", costs: { "none": { "base": 50000 } } },
        "avatar_weightless": { cat: "avatars", tier: "none", costs: { "none": { "base": 50000 } } },
        "avatar_alien": { cat: "avatars", tier: "none", costs: { "none": { "base": 50000 } } },
        "avatar_frosty": { cat: "avatars", tier: "none", costs: { "none": { "base": 50000 } } },
        "avatar_augmented": { cat: "avatars", tier: "none", costs: { "none": { "base": 50000 } } },
        "avatar_cyberspace": { cat: "avatars", tier: "none", costs: { "none": { "base": 50000 } } },
        "avatar_retro_kitties": { cat: "avatars", tier: "none", costs: { "none": { "base": 50000 } } },
        "avatar_destiny": { cat: "avatars", tier: "none", costs: { "none": { "base": 25000 } } },
        "avatar_warmonger": { cat: "avatars", tier: "none", costs: { "none": { "base": 50000 } } },
        "avatar_consuming_wrath": { cat: "avatars", tier: "none", costs: { "none": { "base": 50000 } } },
        "avatar_commander_kitty": { cat: "avatars", tier: "none", costs: { "none": { "base": 50000 } } },
        "avatar_star_pilot": { cat: "avatars", tier: "none", costs: { "none": { "base": 65000 } } },
        "avatar_android": { cat: "avatars", tier: "none", costs: { "none": { "base": 65000 } } },
        "avatar_event_horizon": { cat: "avatars", tier: "none", costs: { "none": { "base": 65000 } } },
        "avatar_star_turtle": { cat: "avatars", tier: "none", costs: { "none": { "base": 65000 } } },
        "avatar_smith_of_destiny": { cat: "avatars", tier: "none", costs: { "none": { "base": 65000 } } }
    }
};