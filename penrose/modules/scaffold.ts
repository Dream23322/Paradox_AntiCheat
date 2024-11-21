import { system, world, Block, PlayerLeaveBeforeEvent, PlayerPlaceBlockBeforeEvent, Vector3, GameMode } from "@minecraft/server";

// Configuration Constants
const SCAFFOLD_THRESHOLD = 3; // Number of blocks placed in quick succession
const TIME_WINDOW = 20; // Time window in ticks (20 ticks = 1 second)
const EXCLUDED_BLOCKS = ["minecraft:scaffolding"]; // Excluded blocks like scaffolding

// Data structure to keep track of block placements
const playerBlockPlacements: Map<string, { positions: Block[]; times: number[] }> = new Map();

// Variables to store the subscription references
let blockPlacementCallback: (arg: PlayerPlaceBlockBeforeEvent) => void;
let playerLeaveCallback: (arg: PlayerLeaveBeforeEvent) => void;

/**
 * Unsubscribes from the scaffold detection events.
 */
export function stopScaffoldCheck() {
    if (blockPlacementCallback) {
        world.beforeEvents.playerPlaceBlock.unsubscribe(blockPlacementCallback);
        blockPlacementCallback = undefined;
    }
    if (playerLeaveCallback) {
        world.beforeEvents.playerLeave.unsubscribe(playerLeaveCallback);
        playerLeaveCallback = undefined;
    }
    playerBlockPlacements.clear();
}

// Gets the numberline opposite of a number.
function rNumber(input: number): number { return -input; }
/**
 * Detects if the player is using scaffolding hacks and returns the positions of suspicious blocks.
 *
 * @param {string} playerId - The ID of the player.
 * @returns {Vector3[]} - An array of block positions that are considered suspicious.
 */
function detectScaffolding(playerId: string): Vector3[] {
    const data = playerBlockPlacements.get(playerId);
    if (!data || data.positions.length < SCAFFOLD_THRESHOLD) return [];

    // Check if blocks were placed within the TIME_WINDOW
    const times = data.times;
    const timeCount = times.length;
    const recentTimes = times[timeCount - 1] - times[timeCount - SCAFFOLD_THRESHOLD];
    if (recentTimes > TIME_WINDOW) return [];

    // Check if exactly two out of three coordinates are constant
    const positions = data.positions.slice(-SCAFFOLD_THRESHOLD);
    const base = positions[0].location;
    let xMatch = 1,
        yMatch = 1,
        zMatch = 1;

    for (let i = 1; i < positions.length; i++) {
        const loc = positions[i].location;
        if (loc.x !== base.x) xMatch = 0;
        if (loc.y !== base.y) yMatch = 0;
        if (loc.z !== base.z) zMatch = 0;
    }

    // At least two axes must match
    if (xMatch + yMatch + zMatch >= 2) {
        return positions.map((block) => block.location);
    }

    return [];
}

/**
 * Initializes the scaffold detection logic by subscribing to relevant events.
 * This function sets up event listeners to detect potential scaffold hacks by players.
 */
export function startScaffoldCheck() {
    blockPlacementCallback = (event: PlayerPlaceBlockBeforeEvent) => {
        const player = event.player;
        const block = event.block;
        const gamemode = player.getGameMode();
        const playerId = player.id;

        // Skip spectators, creative mode, sneaking, or excluded blocks
        if (gamemode === GameMode.spectator || gamemode === GameMode.creative || player.isSneaking || (block && EXCLUDED_BLOCKS.includes(block.typeId))) {
            return;
        }

        // Check the block below for solidity;
        const belowBlock = block.below();
        if (belowBlock?.isSolid && !EXCLUDED_BLOCKS.includes(belowBlock.typeId)) {
            return;
        }

        // Initialize tracking for the player if not already set
        let data = playerBlockPlacements.get(playerId);
        if (!data) {
            data = { positions: [], times: [] };
            playerBlockPlacements.set(playerId, data);
        }

        // Add block placement to the data
        data.positions.push(block);
        data.times.push(system.currentTick);

        // Limit buffer size to avoid excessive memory usage
        if (data.positions.length > SCAFFOLD_THRESHOLD * 2) {
            data.positions.shift();
            data.times.shift();
        }

        // Detect potential scaffolding and handle suspicious blocks
        const suspiciousBlocks = detectScaffolding(playerId);
        if (suspiciousBlocks.length > 0) {
            system.run(() => {
                // Handle block replacement and inventory
                const inventory = player.getComponent("inventory");
                if (inventory && inventory.container) {
                    const blockItemStack = block?.getItemStack(1, true);
                    if (blockItemStack) {
                        inventory.container.addItem(blockItemStack);
                    }
                }
                suspiciousBlocks.forEach((pos) => {
                    const suspiciousBlock = player.dimension.getBlock(pos);
                    if (suspiciousBlock) suspiciousBlock.setType("minecraft:air");
                });
            });
        }

        // Check for common pitch angles that clients use to bypass. Mainly horion client.
        const playerRotation = player.getRotation();
        const pitch = playerRotation.x;
        if(Math.abs(pitch) === 60) {
            system.run(() => {
                // Reset the block and lagback the player as they are 100% using client modifications.
                block.setType("minecraft:air");
                const playerVelocity = player.getVelocity();
                player.setVelocity(rNumber(playerVelocity.x), playerVelocity.y, rNumber(playerVelocity.z));
            });
        }           
    };

    // Clean up when a player leaves
    playerLeaveCallback = (event: PlayerLeaveBeforeEvent) => {
        playerBlockPlacements.delete(event.player.id);
    };

    // Subscribe to events
    world.beforeEvents.playerPlaceBlock.subscribe(blockPlacementCallback);
    world.beforeEvents.playerLeave.subscribe(playerLeaveCallback);
}
