import { world, GameMode, system, Vector3 } from "@minecraft/server";

let currentJobId: number | null = null;
let currentRunId: number | null = null;

/**
 * Subscribes to the player leave event to reset the `tridentUsed` property when a player leaves the game.
 * This ensures that the check for trident usage will be re-evaluated the next time the player joins.
 */
const resetItemUseOnLeave = world.beforeEvents.playerLeave.subscribe((event) => {
    const player = event.player;
    player.setDynamicProperty("tridentUsed", true);
});

/**
 * Subscribes to the item use event to check if the used item is a trident.
 * If the item is a trident, set a dynamic property on the player.
 */
const itemUseCheck = world.beforeEvents.itemUse.subscribe((event) => {
    const player = event.source;
    const item = event.itemStack.typeId;

    if (item === "minecraft:trident") {
        player.setDynamicProperty("tridentUsed", true);
    }
});

/**
 * Generator function to check players' flying status and teleport if necessary.
 * @generator
 * @yields {void} Pauses the generator after processing each player.
 */
function* flyCheckGenerator(): Generator<void, void, unknown> {
    const gm = { excludeGameModes: [GameMode.creative, GameMode.spectator] };
    const filteredPlayers = world.getPlayers(gm);

    for (const player of filteredPlayers) {
        const tridentUsed = player.getDynamicProperty("tridentUsed") as boolean;
        if (tridentUsed) {
            player.setDynamicProperty("tridentUsed", false);
            continue;
        }

        if (player.isGliding || player.isClimbing) {
            continue;
        }

        if (player && (player.getDynamicProperty("securityClearance") as number) === 4) {
            continue;
        }

        if (player.isOnGround) {
            player.setDynamicProperty("airportLanding", player.location);
        }

        const above = player.dimension.getBlock(player.location).above();
        const below = player.dimension.getBlock(player.location).below();
        const north = player.dimension.getBlock(player.location).north();
        const east = player.dimension.getBlock(player.location).east();
        const south = player.dimension.getBlock(player.location).south();
        const west = player.dimension.getBlock(player.location).west();

        const surroundingBlocks = [above, below, north, east, south, west];
        const airBlockCount = surroundingBlocks.filter((block) => block.isAir).length;
        const majorityAreAir = airBlockCount > surroundingBlocks.length / 2;

        const velocity = player.getVelocity();
        const verticalVelocityThreshold = 0.01;
        const hoverTimeThreshold = 2;
        let hoverTime = (player.getDynamicProperty("hoverTime") as number) || 0;

        if ((!player.isFalling && player.isFlying) || (majorityAreAir && Math.abs(velocity.y) > verticalVelocityThreshold && !player.isJumping && !player.isOnGround)) {
            hoverTime += 1;
            player.setDynamicProperty("hoverTime", hoverTime);

            if (hoverTime > hoverTimeThreshold) {
                const airport = player.getDynamicProperty("airportLanding") as Vector3;
                player.teleport(airport, {
                    dimension: player.dimension,
                    rotation: { x: airport.x, y: airport.y },
                    facingLocation: { x: airport.x, y: airport.y, z: airport.z },
                    checkForBlocks: true,
                    keepVelocity: false,
                });

                player.setDynamicProperty("hoverTime", 0);
            }
        } else {
            player.setDynamicProperty("hoverTime", 0);
        }

        yield;
    }
}

/**
 * Executes the fly check generator function with a promise-based approach.
 * @returns {Promise<void>} Resolves once the fly check job is finished.
 */
async function executeFlyCheck(): Promise<void> {
    if (currentJobId !== null) {
        system.clearJob(currentJobId);
    }

    const jobPromise = new Promise<void>((resolve) => {
        function* jobRunner() {
            yield* flyCheckGenerator();
            resolve();
        }
        currentJobId = system.runJob(jobRunner());
    });

    await jobPromise;
}

/**
 * Starts the fly check process and schedules it to run at regular intervals.
 */
export async function startFlyCheck(): Promise<void> {
    if (currentRunId !== null) {
        system.clearRun(currentRunId);
    }

    let isRunning = false;
    let runIdBackup: number;

    if (!itemUseCheck) {
        world.beforeEvents.itemUse.subscribe(itemUseCheck);
    }

    if (!resetItemUseOnLeave) {
        world.beforeEvents.playerLeave.subscribe(resetItemUseOnLeave);
    }

    currentRunId = system.runInterval(async () => {
        if (isRunning) {
            currentRunId = runIdBackup;
            return;
        }

        runIdBackup = currentRunId;
        isRunning = true;

        await executeFlyCheck();
        isRunning = false;
    }, 20); // Check every second (20 ticks)
}

/**
 * Stops the fly check process.
 */
export function stopFlyCheck(): void {
    if (currentJobId !== null) {
        system.clearJob(currentJobId);
    }
    if (currentRunId !== null) {
        system.clearRun(currentRunId);
    }
    if (itemUseCheck) {
        world.beforeEvents.itemUse.unsubscribe(itemUseCheck);
    }
    if (resetItemUseOnLeave) {
        world.beforeEvents.playerLeave.unsubscribe(resetItemUseOnLeave);
    }
}
