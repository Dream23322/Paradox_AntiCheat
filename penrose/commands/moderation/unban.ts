import { Command } from "../../classes/command-handler";
import { ChatSendBeforeEvent } from "@minecraft/server";
import { MinecraftEnvironment } from "../../classes/container/dependencies";

// Define the unban command
export const unbanCommand: Command = {
    name: "unban",
    description: "Unban a previously banned player.",
    usage: "{prefix}unban <player> [ --global | -g ]",
    examples: [`{prefix}unban Steve`, `{prefix}unban Steve --global`],
    category: "Moderation",
    securityClearance: 3,

    /**
     * Executes the unban command.
     * @param {ChatSendBeforeEvent} message - The message object containing information about the command execution context.
     * @param {string[]} args - The command arguments, where the first element should be the player name to unban.
     * @param {MinecraftEnvironment} minecraftEnvironment - The Minecraft environment instance providing access to world and other utilities.
     * @returns {void}
     */
    execute: (message: ChatSendBeforeEvent, args: string[], minecraftEnvironment: MinecraftEnvironment): void => {
        const world = minecraftEnvironment.getWorld();

        // Check for global flag
        const global = ["--global", "-g"].some((flag) => args.includes(flag));
        const dynamicProperty = global ? "globalBannedPlayers" : "bannedPlayers";

        // Filter out the global flag from arguments
        const filteredArgs = args.filter((arg) => !["--global", "-g"].includes(arg));

        // Retrieve the banned players list from dynamic properties and parse it
        const bannedPlayersString = world.getDynamicProperty(dynamicProperty) as string;
        let bannedPlayers: string[];

        try {
            bannedPlayers = bannedPlayersString ? JSON.parse(bannedPlayersString) : [];
        } catch (error) {
            message.sender.sendMessage("§cFailed to retrieve the ban list. Please contact an admin.");
            console.error("Error parsing ban list:", error);
            return;
        }

        // Extract player name from arguments
        const playerName = filteredArgs.join(" ").trim().replace(/["@]/g, "");
        if (!playerName) {
            message.sender.sendMessage("§cPlease provide a valid player name.");
            return;
        }

        // Check if the player is in the banned list
        if (!bannedPlayers.includes(playerName)) {
            message.sender.sendMessage(`§cPlayer "${playerName}" is not in the ${global ? "global" : "local"} ban list.`);
            return;
        }

        // Remove player from the banned list
        bannedPlayers = bannedPlayers.filter((name) => name !== playerName);

        // Save the updated banned players list back to dynamic properties as a JSON string
        world.setDynamicProperty(dynamicProperty, JSON.stringify(bannedPlayers));
        message.sender.sendMessage(`§2[§7Paradox§2]§o§7 Player "${playerName}" has been unbanned from the ${global ? "global" : "local"} ban list.`);
    },
};
