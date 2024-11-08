import { GameMode, Player, ChatSendBeforeEvent } from "@minecraft/server";
import { Command } from "../../classes/command-handler";
import { MinecraftEnvironment } from "../../classes/container/dependencies";

/**
 * Represents the vanish command.
 */
export const vanishCommand: Command = {
    name: "vanish",
    description: "Turns the player invisible to monitor online players.",
    usage: "{prefix}vanish <player>",
    examples: [`{prefix}vanish`, `{prefix}vanish Player Name`, `{prefix}vanish "Player Name"`, `{prefix}vanish help`],
    category: "Moderation",
    securityClearance: 3,

    /**
     * Executes the vanish command.
     * @param {ChatSendBeforeEvent} message - The message object.
     * @param {string[]} args - The command arguments.
     * @param {MinecraftEnvironment} minecraftEnvironment - The Minecraft environment instance.
     */
    execute: (message: ChatSendBeforeEvent, args: string[], minecraftEnvironment: MinecraftEnvironment) => {
        // Retrieve the world and system from the Minecraft environment
        const world = minecraftEnvironment.getWorld();
        const system = minecraftEnvironment.getSystem();
        const gameMode = minecraftEnvironment.getGameMode();

        // Check if player argument is provided
        let player: Player | undefined = undefined;
        const playerName = args.join(" ").trim().replace(/["@]/g, "");

        if (playerName.length > 0) {
            // Find the player object in the world
            player = world.getAllPlayers().find((playerObject) => playerObject.name === playerName);
        }

        // If no player name is provided or player not found, default to message sender
        if (!player && playerName.length === 0) {
            player = message.sender;
        }

        // Inform if the player is not found
        if (!player) {
            message.sender.sendMessage(`§cPlayer "${playerName}" not found.`);
            return;
        }

        system.run(() => {
            if (player && player.isValid()) {
                // Get the player's current game mode
                const playerGameMode = player.getGameMode();

                // Determine if messages should be sent (when playerName is provided and doesn't match player.name)
                const shouldSendMessages = playerName && playerName !== player.name;

                if (playerGameMode !== gameMode.spectator) {
                    // Set the player's game mode to spectator and backup the previous game mode
                    player.setDynamicProperty("GameModeBackup", playerGameMode);
                    player.setGameMode(gameMode.spectator);

                    // Send message indicating that vanish is enabled for the player
                    player.sendMessage(`§2[§7Paradox§2]§o§7 Vanish enabled!`);

                    // If playerName is provided and doesn't match the name of the player, send a message to the command sender as well
                    if (shouldSendMessages) {
                        message.sender.sendMessage(`§2[§7Paradox§2]§o§7 Vanish enabled!`);
                    }
                } else {
                    // Restore the player's previous game mode
                    const backupGameMode = player.getDynamicProperty("GameModeBackup");
                    player.setGameMode(backupGameMode as GameMode);
                    player.setDynamicProperty("GameModeBackup", undefined);

                    // Send message indicating that vanish is disabled for the player
                    player.sendMessage(`§2[§7Paradox§2]§o§7 Vanish disabled!`);

                    // If playerName is provided and doesn't match the name of the player, send a message to the command sender as well
                    if (shouldSendMessages) {
                        message.sender.sendMessage(`§2[§7Paradox§2]§o§7 Vanish disabled!`);
                    }
                }
            }
        });
    },
};
