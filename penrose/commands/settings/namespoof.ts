import { ChatSendBeforeEvent } from "@minecraft/server";
import { Command } from "../../classes/command-handler";
import { MinecraftEnvironment } from "../../classes/container/dependencies";
import { startNamespoofDetection, stopNamespoofDetection } from "../../modules/namespoof";

/**
 * Represents the namespoof detection command.
 */
export const nameSpoofCommand: Command = {
    name: "namespoof",
    description: "Toggles the name-spoof detection module.",
    usage: "{prefix}namespoof [ help ]",
    examples: [`{prefix}namespoof`, `{prefix}namespoof help`],
    category: "Modules",
    securityClearance: 4,

    /**
     * Executes the name-spoof detection command.
     * @param {ChatSendBeforeEvent} message - The message object.
     * @param {string[]} _ - The command arguments.
     * @param {MinecraftEnvironment} minecraftEnvironment - The Minecraft environment instance.
     */
    execute: (message: ChatSendBeforeEvent, _: string[], minecraftEnvironment: MinecraftEnvironment) => {
        const player = message.sender;
        const world = minecraftEnvironment.getWorld();
        const system = minecraftEnvironment.getSystem();
        const moduleKey = "paradoxModules";

        // Get Dynamic Property Boolean
        const paradoxModules: { [key: string]: boolean | number | string } = JSON.parse(world.getDynamicProperty(moduleKey) as string) || {};
        const nameSpoofEnabled = (paradoxModules["nameSpoofCheck_b"] as boolean) || false;

        if (!nameSpoofEnabled) {
            // Enable the module
            paradoxModules["nameSpoofCheck_b"] = true;
            world.setDynamicProperty(moduleKey, JSON.stringify(paradoxModules));
            player.sendMessage(`§2[§7Paradox§2]§o§7 Name-spoof detection has been §aenabled§7.`);
            system.run(() => {
                startNamespoofDetection();
            });
        } else {
            // Disable the module
            paradoxModules["nameSpoofCheck_b"] = false;
            world.setDynamicProperty(moduleKey, JSON.stringify(paradoxModules));
            player.sendMessage(`§2[§7Paradox§2]§o§7 Name-spoof detection has been §4disabled§7.`);
            system.run(() => {
                stopNamespoofDetection();
            });
        }
    },
};