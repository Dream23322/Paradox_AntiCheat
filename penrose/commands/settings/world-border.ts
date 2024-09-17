import { ChatSendBeforeEvent, system } from "@minecraft/server";
import { Command } from "../../classes/command-handler";
import { MinecraftEnvironment } from "../../classes/container/dependencies";
import { startWorldBorderCheck, stopWorldBorderCheck } from "../../modules/world-border";

/**
 * Represents the worldborder command.
 */
export const worldBorderCommand: Command = {
    name: "worldborder",
    description: "Sets the world border and restricts players to that border.",
    usage: `{prefix}worldborder [ --overworld | -o <size> ] [ --nether | -n <size> ]
            [ --end | -e <size> ] [ -d | --disable ] [ -l | --list ]`,
    examples: [
        `{prefix}worldborder -o 10000 -n 5000 -e 10000`,
        `{prefix}worldborder --overworld 10000 --nether 5000`,
        `{prefix}worldborder --overworld 10000`,
        `{prefix}worldborder --nether 5000`,
        `{prefix}worldborder -n 5000`,
        `{prefix}worldborder disable`,
        `{prefix}worldborder -l`,
        `{prefix}worldborder --list`,
    ],
    category: "Modules",
    securityClearance: 4,
    dynamicProperty: "worldBorderCheck_b",

    // Command parameters for the GUI
    parameters: [
        {
            alias: "-o",
            description: "Set the world border size for the Overworld",
            type: "input",
        },
        {
            alias: "-n",
            description: "Set the world border size for the Nether",
            type: "input",
        },
        {
            alias: "-e",
            description: "Set the world border size for The End",
            type: "input",
        },
        {
            alias: "-d",
            description: "Disable the world border",
            type: "toggle",
        },
        {
            alias: "-l",
            description: "List the current world border configurations",
            type: "toggle",
        },
    ],

    /**
     * Executes the worldborder command.
     * @param {ChatSendBeforeEvent} message - The message object.
     * @param {string[]} args - The command arguments.
     * @param {MinecraftEnvironment} minecraftEnvironment - The Minecraft environment instance.
     */
    execute: (message: ChatSendBeforeEvent, args: string[], minecraftEnvironment: MinecraftEnvironment) => {
        const player = message.sender;
        const world = minecraftEnvironment.getWorld();
        const moduleKey = "paradoxModules";

        const modeKeys = {
            worldBorderCheck: "worldBorderCheck_b",
            worldBorderSettings: "worldBorder_settings",
        };

        let paradoxModules: {
            [key: string]: boolean | number | { [key: string]: number };
        } = JSON.parse(world.getDynamicProperty(moduleKey) as string) || {};

        const modeStates = {
            worldBorderCheck: paradoxModules[modeKeys.worldBorderCheck] ?? false,
            worldBorderSettings: (paradoxModules[modeKeys.worldBorderSettings] ?? {
                overworld: 0,
                nether: 0,
                end: 0,
            }) as { overworld: number; nether: number; end: number },
        };

        if (!args.length) {
            const prefix = (world.getDynamicProperty("__prefix") as string) || "!";
            player.sendMessage(`§2[§7Paradox§2]§o§7 Usage: {prefix}worldborder <value> [optional]. For help, use ${prefix}worldborder help.`);
            return;
        }

        if (args[0] === "--disable" || args[0] === "-d") {
            player.sendMessage(`§2[§7Paradox§2]§o§7 World Border has been §4disabled§7.`);
            paradoxModules[modeKeys.worldBorderCheck] = false;
            world.setDynamicProperty(moduleKey, JSON.stringify(paradoxModules));
            stopWorldBorderCheck();
            return;
        }

        if (args[0] === "-l" || args[0] === "--list") {
            player.sendMessage(
                [
                    `§2[§7Paradox§2]§o§7 Current World Border Settings:`,
                    `  | §7World Border Check: ${modeStates.worldBorderCheck ? "§aEnabled§7" : "§4disabled§7"}`,
                    `  | §7Overworld Border Size§7: §2[ §f${modeStates.worldBorderSettings.overworld}§2 ]§7`,
                    `  | §7Nether Border Size§7: §2[ §f${modeStates.worldBorderSettings.nether}§2 ]§7`,
                    `  | §7End Border Size§7: §2[ §f${modeStates.worldBorderSettings.end}§2 ]§7`,
                ].join("\n")
            );
            return;
        }

        const paramIndexes: { [key: string]: number } = {
            "--overworld": -1,
            "-o": -1,
            "--nether": -1,
            "-n": -1,
            "--end": -1,
            "-e": -1,
        };

        for (let i = 0; i < args.length; i++) {
            if (paramIndexes[args[i]] !== undefined) {
                paramIndexes[args[i]] = i;
            }
        }

        let overworldSize = modeStates.worldBorderSettings.overworld as number;
        let netherSize = modeStates.worldBorderSettings.nether as number;
        let endSize = modeStates.worldBorderSettings.end as number;

        for (let i = 0; i < args.length; i++) {
            const arg = args[i].toLowerCase();
            switch (arg) {
                case "--overworld":
                case "-o":
                    overworldSize = Number(args[i + 1]);
                    break;
                case "--nether":
                case "-n":
                    netherSize = Number(args[i + 1]);
                    break;
                case "--end":
                case "-e":
                    endSize = Number(args[i + 1]);
                    break;
            }
        }

        if (overworldSize || netherSize || endSize) {
            player.sendMessage(
                [
                    `§2[§7Paradox§2]§o§7 World Border has been ${modeStates.worldBorderCheck ? "§aupdated§7" : "§aenabled§7"}!`,
                    `  | §fOverworld§7: §2[ §7${overworldSize}§2 ]§7`,
                    `  | §fNether§7: §2[ §7${netherSize}§2 ]§7`,
                    `  | §fEnd§7: §2[ §7${endSize}§2 ]§f`,
                ].join("\n")
            );

            paradoxModules[modeKeys.worldBorderCheck] = true;
            paradoxModules[modeKeys.worldBorderSettings] = {
                overworld: Math.abs(overworldSize),
                nether: Math.abs(netherSize),
                end: Math.abs(endSize),
            };
            world.setDynamicProperty(moduleKey, JSON.stringify(paradoxModules));
            system.run(() => {
                startWorldBorderCheck();
            });
            return;
        }

        const prefix = (world.getDynamicProperty("__prefix") as string) || "!";
        player.sendMessage(`§2[§7Paradox§2]§o§7 Invalid arguments. For help, use ${prefix}worldborder help.`);
    },
};
