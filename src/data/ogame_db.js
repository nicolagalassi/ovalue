// NOTA: In Vue/Vite dobbiamo usare "export const" davanti al nome
export const OGAME_DB = {
    "resources": {
        "items": {
            "metal_mine": { "b": [60, 15, 0], "f": 1.5, "type": "building" },
            "crystal_mine": { "b": [48, 24, 0], "f": 1.6, "type": "building" },
            "deuterium_synthesizer": { "b": [225, 75, 0], "f": 1.5, "type": "building" },
            "solar_plant": { "b": [75, 30, 0], "f": 1.5, "type": "building" },
            "fusion_reactor": { "b": [900, 360, 180], "f": 1.8, "type": "building" },
            "solar_satellite": { "b": [0, 2000, 500], "f": 1, "type": "building" },
            "crawler": { "b": [2000, 2000, 1000], "f": 1, "type": "unit" }
        }
    },
    "facilities": {
        "items": {
            "robotics_factory": { "b": [400, 120, 200], "f": 2, "type": "building" },
            "shipyard": { "b": [400, 200, 100], "f": 2, "type": "building" },
            "research_lab": { "b": [200, 400, 200], "f": 2, "type": "building" },
            "alliance_depot": { "b": [20000, 40000, 0], "f": 2, "type": "building" },
            "missile_silo": { "b": [20000, 20000, 1000], "f": 2, "type": "building" },
            "nanite_factory": { "b": [1000000, 500000, 100000], "f": 2, "type": "building" },
            "terraformer": { "b": [0, 50000, 100000], "f": 2, "type": "building" },
            "space_dock": { "b": [200, 0, 50], "f": 2, "type": "building" }
        }
    },
    "research": {
        "items": {
            "energy_technology": { "b": [0, 800, 400], "f": 2, "type": "research" },
            "laser_technology": { "b": [200, 100, 0], "f": 2, "type": "research" },
            "ion_technology": { "b": [1000, 300, 100], "f": 2, "type": "research" },
            "hyperspace_technology": { "b": [0, 4000, 2000], "f": 2, "type": "research" },
            "plasma_technology": { "b": [2000, 4000, 1000], "f": 2, "type": "research" },
            "combustion_drive": { "b": [400, 0, 600], "f": 2, "type": "research" },
            "impulse_drive": { "b": [2000, 4000, 600], "f": 2, "type": "research" },
            "hyperspace_drive": { "b": [10000, 20000, 6000], "f": 2, "type": "research" },
            "espionage_technology": { "b": [200, 1000, 200], "f": 2, "type": "research" },
            "computer_technology": { "b": [0, 400, 600], "f": 2, "type": "research" },
            "astrophysics": { "b": [4000, 8000, 4000], "f": 1.75, "type": "research" },
            "intergalactic_research_network": { "b": [240000, 400000, 160000], "f": 2, "type": "research" },
            "graviton_technology": { "b": [0, 0, 0], "f": 3, "type": "research" },
            "weapons_technology": { "b": [800, 200, 0], "f": 2, "type": "research" },
            "shielding_technology": { "b": [200, 600, 0], "f": 2, "type": "research" },
            "armor_technology": { "b": [1000, 0, 0], "f": 2, "type": "research" }
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
    }
};