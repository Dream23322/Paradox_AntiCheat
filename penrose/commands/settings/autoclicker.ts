import { ChatSendBeforeEvent } from "@minecraft/server";
import { Command } from "../../classes/command-handler";
import { MinecraftEnvironment } from "../../classes/container/dependencies";
import { startAutoClicker, stopAutoClicker } from "../../modules/autoclicker";
import { getParadoxModules, updateParadoxModules } from "../../utility/paradox-modules-manager";

/**
 * Represents the auto-clicker detection command.
 */
export const autoClickerCommand: Command = {
    name: "autoclicker",
    description: "Toggles the auto-clicker detection module.",
    usage: "{prefix}autoclicker [ help ]",
    examples: [`{prefix}autoclicker`, `{prefix}autoclicker help`],
    category: "Modules",
    securityClearance: 4,

    /**
     * Executes the auto-clicker detection command.
     * @param {ChatSendBeforeEvent} message - The message object.
     * @param {string[]} _ - The command arguments.
     * @param {MinecraftEnvironment} minecraftEnvironment - The Minecraft environment instance.
     */
    execute: (message: ChatSendBeforeEvent, _: string[], minecraftEnvironment: MinecraftEnvironment) => {
        const player = message.sender;
        const world = minecraftEnvironment.getWorld();
        const system = minecraftEnvironment.getSystem();

        // Get Dynamic Property Boolean
        const paradoxModules = getParadoxModules(world);
        const autoClickerEnabled = (paradoxModules["autoClickerCheck_b"] as boolean) || false;

        if (!autoClickerEnabled) {
            // Enable the module
            paradoxModules["autoClickerCheck_b"] = true;
            updateParadoxModules(world, paradoxModules);
            player.sendMessage(`§2[§7Paradox§2]§o§7 Auto-clicker detection has been §aenabled§7.`);
            system.run(() => {
                startAutoClicker();
            });
        } else {
            // Disable the module
            paradoxModules["autoClickerCheck_b"] = false;
            updateParadoxModules(world, paradoxModules);
            player.sendMessage(`§2[§7Paradox§2]§o§7 Auto-clicker detection has been §4disabled§7.`);
            system.run(() => {
                stopAutoClicker();
            });
        }
    },
};
