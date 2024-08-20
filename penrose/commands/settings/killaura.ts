import { ChatSendAfterEvent } from "@minecraft/server";
import { Command } from "../../classes/command-handler";
import { MinecraftEnvironment } from "../../classes/container/dependencies";
import { initializeKillAura } from "../../modules/killaura";

/**
 * Represents the killaura detection command.
 */
export const killauraCommand: Command = {
    name: "killaura",
    description: "Toggles the killaura detection module.",
    usage: "{prefix}killaura [ help ]",
    examples: [`{prefix}killaura`, `{prefix}killaura help`],
    category: "Modules",
    securityClearance: 4,

    /**
     * Executes the killaura detection command.
     * @param {ChatSendAfterEvent} message - The message object.
     * @param {string[]} _ - The command arguments.
     * @param {MinecraftEnvironment} minecraftEnvironment - The Minecraft environment instance.
     */
    execute: (message: ChatSendAfterEvent, _: string[], minecraftEnvironment: MinecraftEnvironment) => {
        const player = message.sender;
        const world = minecraftEnvironment.getWorld();
        const moduleKey = "paradoxModules";

        // Get Dynamic Property Boolean
        const paradoxModules: { [key: string]: boolean | number | string } = JSON.parse(world.getDynamicProperty(moduleKey) as string) || {};
        const killauraEnabled = (paradoxModules["killAuraCheck_b"] as boolean) || false;

        if (!killauraEnabled) {
            // Enable the module
            paradoxModules["killAuraCheck_b"] = true;
            world.setDynamicProperty(moduleKey, JSON.stringify(paradoxModules));
            player.sendMessage(`§2[§7Paradox§2]§o§7 Killaura detection has been §aenabled§7.`);
            initializeKillAura();
        } else {
            // Disable the module
            paradoxModules["killAuraCheck_b"] = false;
            world.setDynamicProperty(moduleKey, JSON.stringify(paradoxModules));
            player.sendMessage(`§2[§7Paradox§2]§o§7 Killaura detection has been §4disabled§7.`);
        }
    },
};