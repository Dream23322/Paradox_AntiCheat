import { Vector3Builder, Vector3Utils } from "../node_modules/@minecraft/math/dist/minecraft-math";
import { world, Player, system, EntityHitEntityAfterEvent } from "@minecraft/server";

// Configuration Constants
const MAX_ATTACKS_PER_SECOND = 14; // Maximum allowed attacks per second
const MAX_ATTACK_DISTANCE = 4.5; // Maximum attack distance (in blocks)
const MAX_ORIENTATION_DIFFERENCE = 60; // Maximum allowed angle difference (in degrees) between player's view and the target
const BUFFER_SIZE = 20; // Buffer size for storing recent attack times

// Data structure to track players' attack times
const playerAttackData: Map<string, number[]> = new Map();

/**
 * Calculates the average of an array of numbers.
 * @param {number[]} values - Array of numbers.
 * @returns {number} - Average value.
 */
function calculateAverage(values: number[]): number {
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
}

/**
 * Calculates the standard deviation of an array of numbers.
 * @param {number[]} values - Array of numbers.
 * @param {number} average - Average value of the array.
 * @returns {number} - Standard deviation.
 */
function calculateStandardDeviation(values: number[], average: number): number {
    const variance = values.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / values.length;
    return Math.sqrt(variance);
}

/**
 * Determines a dynamic threshold based on interval differences.
 * @param {number[]} intervals - Array of intervals.
 * @returns {number} - Dynamic threshold.
 */
function getDynamicThreshold(intervals: number[]): number {
    if (intervals.length < 2) return 1; // Minimum threshold if not enough data

    const differences = intervals.slice(1).map((val, index) => val - intervals[index]);
    const averageDifference = calculateAverage(differences);
    const stdDeviation = calculateStandardDeviation(differences, averageDifference);

    // Set the threshold as a multiple of average difference plus a factor of variability
    const THRESHOLD_FACTOR = 1.5; // Adjust based on needs
    return averageDifference + THRESHOLD_FACTOR * stdDeviation;
}

/**
 * Handles the entity hit event to detect killaura behavior.
 *
 * @param {EntityHitEntityAfterEvent} event - The entity hit event.
 */
function onEntityHit(event: EntityHitEntityAfterEvent) {
    const attacker = event.damagingEntity;
    const target = event.hitEntity;
    const attackerRots = attacker.getRotation();

    // Only proceed if the attacker and target are players
    if (!(attacker instanceof Player) || !(target instanceof Player)) return;

    const currentTime = system.currentTick;
    const attackerId = attacker.id;

    // Initialize or update the player's attack times
    if (!playerAttackData.has(attackerId)) {
        playerAttackData.set(attackerId, []);
    }
    const attackTimes = playerAttackData.get(attackerId)!;

    // Add the current attack time to the buffer
    attackTimes.push(currentTime);

    // Limit the number of attacks in the buffer to a maximum of 10
    if (attackTimes.length > BUFFER_SIZE) {
        attackTimes.shift(); // Remove the oldest attack time to maintain buffer size
    }

    // Check if the number of attacks in the last second exceeds the maximum allowed
    const recentAttacks = attackTimes.filter((time) => currentTime - time <= 20); // Last 20 ticks (1 second)

    const attackerLocation = new Vector3Builder(attacker.location.x, attacker.location.y, attacker.location.z);
    const targetLocation = new Vector3Builder(target.location.x, target.location.y, target.location.z);
    const distance = Vector3Utils.distance(attackerLocation, targetLocation);
    const isFacingTarget = checkIfFacingEntity(attacker, target);

    // Flag player for suspicious killaura behavior
    if (!isFacingTarget || distance > MAX_ATTACK_DISTANCE || recentAttacks.length >= MAX_ATTACKS_PER_SECOND || isSuspiciousAttackPattern(attackTimes) || isFlatRotation(attackerRots.x, attackerRots.y) {
        const healthComponentVictim = target.getComponent("health");

        // Get or initialize the victim's health
        let previousHealth = target.getDynamicProperty("paradoxCurrentHealth") as number;
        if (previousHealth === undefined) {
            previousHealth = healthComponentVictim.currentValue;
            target.setDynamicProperty("paradoxCurrentHealth", previousHealth);
        }

        // Restore the victim's health
        const healthDifference = previousHealth - healthComponentVictim.currentValue;
        healthComponentVictim.setCurrentValue(healthComponentVictim.currentValue + healthDifference);

        // Update the dynamic property with the new health value
        target.setDynamicProperty("paradoxCurrentHealth", healthComponentVictim.currentValue);
    }
}

/**
 * Checks if the attacker is facing the target entity within a specified angle.
 *
 * @param {Player} attacker - The player attacking the target.
 * @param {Player} target - The target entity being attacked.
 * @returns {boolean} - True if the attacker is facing the target within the angle threshold.
 */
function checkIfFacingEntity(attacker: Player, target: Player): boolean {
    const attackerDirection = attacker.getViewDirection();
    const attackerVector = new Vector3Builder(attackerDirection.x, attackerDirection.y, attackerDirection.z);
    const targetVector = new Vector3Builder(target.location.x - attacker.location.x, target.location.y - attacker.location.y, target.location.z - attacker.location.z).normalize();

    const dotProduct = Vector3Utils.dot(attackerVector, targetVector);
    const angle = Math.acos(dotProduct) * (180 / Math.PI);

    return angle <= MAX_ORIENTATION_DIFFERENCE;
}

/**
 * Analyzes the pattern of recent attack times to determine if the behavior is suspicious.
 *
 * @param {number[]} attackTimes - Array of attack times.
 * @returns {boolean} - True if the pattern is suspicious based on interval differences.
 */
function isSuspiciousAttackPattern(attackTimes: number[]): boolean {
    if (attackTimes.length < 3) return false; // Need at least three times to check for consistency

    // Compute the intervals between consecutive attack times
    const intervals = attackTimes.slice(1).map((time, index) => time - attackTimes[index]);

    // Compute the differences between consecutive intervals
    const intervalDifferences = intervals.slice(1).map((interval, index) => interval - intervals[index]);

    // Get the dynamic threshold based on interval differences
    const dynamicThreshold = getDynamicThreshold(intervals);

    // Check if all interval differences fall within the dynamic threshold
    const isConsistent = intervalDifferences.every((diff) => Math.abs(diff) <= dynamicThreshold);

    return isConsistent; // Return true if all interval differences are within the threshold range
}

// isFlatRotation returns if the players pitch and/or yaw is flat (rounded), this is a common issue in a lot of hive clients, which are the only ones updated currently.
function isFlatRotation(pitch: number, yaw: number) {

    // Get the difference between the rounded rotations and the actual rotation, if its 0 its rounded so return true.
    // If the pitch or yaw is 0, it can mean that the player has teleported causing their rotation to be 0, 0
    const isFlatPitch = Math.abs(Math.round(pitch) - pitch) === 0 && pitch !== 0;
    const isFlatYaw = Math.abs(Math.round(yaw) - yaw) === 0 && yaw !== 0;
    // The logic above can be improved to account for some clients (private versions of solstice do this) which add a small float value to their pitch or yaw if it's flat. 
    // This can be detected but WILL need a buffer to stop false flags as it can be achieved legit, if the advanced logic is added, I would also recommending confirming that the player is moving with some decent speed.
    
    return isFlatPitch || isFlatYaw;
}

/**
 * Subscribes to the entity hit event for killaura detection.
 */
export function startKillAuraCheck() {
    world.afterEvents.entityHitEntity.subscribe(onEntityHit);
}

/**
 * Unsubscribes to the entity hit event for killaura detection.
 */
export function stopKillAuraCheck() {
    world.afterEvents.entityHitEntity.unsubscribe(onEntityHit);
}
