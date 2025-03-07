import { ChatSendBeforeEvent } from "@minecraft/server";
import { Command } from "../../classes/command-handler";
import { MinecraftEnvironment } from "../../classes/container/dependencies";
import { startLagClear, stopLagClear } from "../../modules/lag-clear";
import { getParadoxModules, updateParadoxModules } from "../../utility/paradox-modules-manager";

/**
 * Represents the lagclear command.
 */
export const lagClearCommand: Command = {
    name: "lagclear",
    description: "Clears items and entities with a timer.",
    usage: "{prefix}lagclear [ hours ] [ minutes ] [ seconds ]",
    examples: [`{prefix}lagclear`, `{prefix}lagclear 0 5 0`, `{prefix}lagclear 0 10 30`],
    category: "Modules",
    securityClearance: 4,

    /**
     * Executes the lagclear command.
     * @param {ChatSendBeforeEvent} message - The message object.
     * @param {string[]} args - The command arguments.
     * @param {MinecraftEnvironment} minecraftEnvironment - The Minecraft environment instance.
     */
    execute: (message: ChatSendBeforeEvent, args: string[], minecraftEnvironment: MinecraftEnvironment) => {
        const player = message.sender;
        const world = minecraftEnvironment.getWorld();
        const system = minecraftEnvironment.getSystem();

        // Retrieve and update module state
        let paradoxModules = getParadoxModules(world);

        // Default values
        let hours = 0;
        let minutes = 5;
        let seconds = 0;

        if (args.length === 3) {
            hours = parseInt(args[0], 10) || 0;
            minutes = parseInt(args[1], 10) || 0;
            seconds = parseInt(args[2], 10) || 0;

            // Update settings without toggling if lag clear is already enabled
            const lagClearKey = "lagClearCheck_b";
            const lagClearSettingsKey = "lagClear_settings";
            paradoxModules[lagClearSettingsKey] = { hours, minutes, seconds };
            paradoxModules[lagClearKey] = true;
            updateParadoxModules(world, paradoxModules);
            player.sendMessage(`§2[§7Paradox§2]§o§7 LagClear timer updated to §2[ §7${hours}§7 : §7${minutes}§7 : §7${seconds}§7 §2]§7.`);
            // Restart LagClear with the new settings
            system.run(() => {
                startLagClear(hours, minutes, seconds);
            });
        } else {
            // Use existing settings if available
            const lagClearSettingsKey = "lagClear_settings";
            if (paradoxModules[lagClearSettingsKey] && typeof paradoxModules[lagClearSettingsKey] === "object") {
                const settings = paradoxModules[lagClearSettingsKey] as { hours: number; minutes: number; seconds: number };
                hours = settings.hours;
                minutes = settings.minutes;
                seconds = settings.seconds;
            }

            const lagClearKey = "lagClearCheck_b";
            const lagClearBoolean = (paradoxModules[lagClearKey] as boolean) || false;

            if (lagClearBoolean === false) {
                // Enable LagClear
                paradoxModules[lagClearKey] = true;
                paradoxModules[lagClearSettingsKey] = { hours, minutes, seconds };
                updateParadoxModules(world, paradoxModules);
                player.sendMessage("§2[§7Paradox§2]§o§7 LagClear has been §aenabled§7.");
                system.run(() => {
                    startLagClear(hours, minutes, seconds);
                });
            } else {
                // Disable LagClear
                paradoxModules[lagClearKey] = false;
                updateParadoxModules(world, paradoxModules);
                player.sendMessage("§2[§7Paradox§2]§o§7 LagClear has been §4disabled§7.");
                system.run(() => {
                    stopLagClear();
                });
            }
        }
    },
};
