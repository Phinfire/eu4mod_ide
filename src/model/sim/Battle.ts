enum Terrain {
    FARMLAND = "Farmland",
    FOREST = "Forest",
    MOUNTAINS = "Mountains",
}

enum UnitType {
    INFANTRY = "Infantry",
    CAVALRY = "Cavalry",
    ARTILLERY = "Artillery",
}

enum Phase {
    FIRE = "Fire",
    SHOCK = "Shock",
}

interface Leader {
    shock: number;
    fire: number;
    maneuver: number;
    siege: number;
}

interface Regiment {
    type: UnitType;
    strength: number;
    maxMorale: number;
    morale: number;
}

function battle(attacker: Regiment[], defender: Regiment[], attackerLeader: Leader, defenderLeader: Leader, terrain: Terrain) {
    let keepFighting = true;
    let battleDay = 0;
    let phase = Phase.FIRE;
    while (keepFighting) {
        phase = phase === Phase.FIRE ? Phase.SHOCK : Phase.FIRE;
        for (let phaseDay = 0; phaseDay < 2; phaseDay++) {
            // remove 0 strength or morale regiments   
            battleDay++;
        }
    }
}

// TODO: cav/inf ration tactics penalty

function calculateBaseCasualities(diceRollIncludingBonus: number, attackingLeaderValue: number, defendingLeaderValue: number, attackingPips: number, defendingPips: number, terrainImpact: number) {
    return 15 + Math.max(0, diceRollIncludingBonus + Math.max(0, attackingLeaderValue - defendingLeaderValue) + attackingPips - defendingPips + terrainImpact); // + terrainImpact so terrain property can be neg
}

function calculateCasualtiesModifier(strength: number, regimentsFireOrShock: number, tacticsRatio: number, combatAbility: number, disclipine: number, battleDay: number) {
    return (strength/1000) * (regimentsFireOrShock/tacticsRatio) * (1 + combatAbility) * (1 + disclipine) * (1 +  battleDay/100);
}

function calculateMoraleCasualities(baseCasualties: number, casualtiesModifier: number, attackerDamageDealtModifier: number, targetDamageReceivedModifier: number, maxMorale: number, passiveMoraleDamage: number) {
    return baseCasualties * casualtiesModifier * (1 + attackerDamageDealtModifier) * (1-targetDamageReceivedModifier) * (maxMorale/540) + passiveMoraleDamage;
} + // + 40% for backline

function calculateStrengthCasualities(baseCasualties: number, casualtiesModifier: number, attackerDamageDealtModifier: number, targetDamageReceivedModifier: number) {
    return baseCasualties * casualtiesModifier * (1 + attackerDamageDealtModifier) * (1-targetDamageReceivedModifier);
}

function calculateMaxDeployedingArtillery(leaderManeuver: number) {
    return 1 + Math.floor(leaderManeuver/2);
}