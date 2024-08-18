import { Command } from "../../classes/command-handler";
import { ChatSendBeforeEvent } from "@minecraft/server";
import { MinecraftEnvironment } from "../../classes/container/dependencies";

// Define the unban command
export const unbanCommand: Command = {
    name: "unban",
    description: "Unban a previously banned player.",
    usage: "{prefix}unban <player>",
    examples: [`{prefix}unban Steve`],
    category: "Moderation",
    securityClearance: 3,

    execute: (message: ChatSendBeforeEvent, args: string[], minecraftEnvironment: MinecraftEnvironment) => {
        const world = minecraftEnvironment.getWorld();

        // Retrieve the banned players list from dynamic properties and parse it
        const bannedPlayersString = world.getDynamicProperty("bannedPlayers") as string;
        let bannedPlayers: string[] = [];

        try {
            bannedPlayers = bannedPlayersString ? JSON.parse(bannedPlayersString) : [];
        } catch (error) {
            // In case of parsing error, initialize as an empty array
            bannedPlayers = [];
        }

        // Extract player name from arguments
        const playerName = args.join(" ").trim().replace(/["@]/g, "");

        if (!playerName) {
            message.sender.sendMessage("§4[§6Paradox§4]§o§7 Please provide a player name.");
            return;
        }

        // Check if the player is in the banned list
        if (bannedPlayers.includes(playerName)) {
            // Remove player from the banned list
            bannedPlayers = bannedPlayers.filter((name) => name !== playerName);

            // Save the updated banned players list back to dynamic properties as a JSON string
            world.setDynamicProperty("bannedPlayers", JSON.stringify(bannedPlayers));
            message.sender.sendMessage(`§4[§6Paradox§4]§o§7 Player "${playerName}" has been unbanned.`);
        } else {
            message.sender.sendMessage(`§4[§6Paradox§4]§o§7 Player "${playerName}" is not in the banned list.`);
        }
    },
};
