/* eslint no-var: "off"*/
import { world, Player, ChatSendBeforeEvent } from "@minecraft/server";
import { MinecraftEffectTypes } from "@minecraft/vanilla-data";
import config from "../../data/config.js";
import { TickFreeze } from "../../penrose/TickEvent/freeze/freeze.js";
import { dynamicPropertyRegistry } from "../../penrose/WorldInitializeAfterEvent/registry.js";
import { getPrefix, sendMsg, sendMsgToPlayer } from "../../util.js";

function freezeHelp(player: Player, prefix: string) {
    let commandStatus: string;
    if (!config.customcommands.freeze) {
        commandStatus = "§6[§4DISABLED§6]§r";
    } else {
        commandStatus = "§6[§aENABLED§6]§r";
    }
    return sendMsgToPlayer(player, [
        `\n§4[§6Command§4]§r: freeze`,
        `§4[§6Status§4]§r: ${commandStatus}`,
        `§4[§6Usage§4]§r: freeze [optional]`,
        `§4[§6Optional§4]§r: username, help`,
        `§4[§6Description§4]§r: Will freeze or unfreeze the specified player.`,
        `§4[§6Examples§4]§r:`,
        `    ${prefix}freeze ${player.name}`,
        `    ${prefix}freeze help`,
    ]);
}

/**
 * @name freeze
 * @param {ChatSendBeforeEvent} message - Message object
 * @param {string[]} args - Additional arguments provided (optional).
 */
export async function freeze(message: ChatSendBeforeEvent, args: string[]) {
    // validate that required params are defined
    if (!message) {
        return console.warn(`${new Date()} | ` + "Error: ${message} isnt defined. Did you forget to pass it? (./commands/utility/freeze.js:30)");
    }

    message.cancel = true;

    const player = message.sender;

    // Get unique ID
    const uniqueId = dynamicPropertyRegistry.get(player?.id);

    // Make sure the user has permissions to run the command
    if (uniqueId !== player.name) {
        return sendMsgToPlayer(player, `§r§4[§6Paradox§4]§r You need to be Paradox-Opped to use this command.`);
    }

    // Check for custom prefix
    const prefix = getPrefix(player);

    // Are there arguements
    if (!args.length) {
        return freezeHelp(player, prefix);
    }

    // Was help requested
    const argCheck = args[0];
    if ((argCheck && args[0].toLowerCase() === "help") || !config.customcommands.freeze) {
        return freezeHelp(player, prefix);
    }

    // try to find the player requested
    let member: Player;
    const players = world.getPlayers();
    for (const pl of players) {
        if (pl.nameTag.toLowerCase().includes(args[0].toLowerCase().replace(/"|\\|@/g, ""))) {
            member = pl;
            break;
        }
    }

    if (!member) {
        return sendMsgToPlayer(player, `§r§4[§6Paradox§4]§r Couldnt find that player!`);
    }

    // Get unique ID
    const uniqueId2 = dynamicPropertyRegistry.get(member?.id);

    // Make sure the user has permissions to run the command
    if (uniqueId2 === member.name) {
        return sendMsgToPlayer(player, `§r§4[§6Paradox§4]§r You cannot freeze staff members.`);
    }

    if (member.hasTag("freeze")) {
        member.addTag("nofreeze");
    }
    if (member.hasTag("nofreeze")) {
        member.removeTag("freeze");
    }
    if (member.hasTag("nofreeze")) {
        await member.runCommandAsync(`effect @s clear`);
        sendMsgToPlayer(member, `§r§4[§6Paradox§4]§r You are no longer frozen.`);
        sendMsg(`@a[tag=paradoxOpped]`, `${member.nameTag}§r is no longer frozen.`);
    }

    if (!member.hasTag("nofreeze")) {
        // Blindness
        member.addEffect(MinecraftEffectTypes.Blindness, 1000000, { amplifier: 255, showParticles: true });
        // Mining Fatigue
        member.addEffect(MinecraftEffectTypes.MiningFatigue, 1000000, { amplifier: 255, showParticles: true });
        // Weakness
        member.addEffect(MinecraftEffectTypes.Weakness, 1000000, { amplifier: 255, showParticles: true });
        // Slowness
        member.addEffect(MinecraftEffectTypes.Slowness, 1000000, { amplifier: 255, showParticles: true });
    }

    if (!member.hasTag("nofreeze")) {
        member.addTag("freeze");
        sendMsg(`@a[tag=paradoxOpped]`, `${member.nameTag}§r is now frozen.`);
        return TickFreeze(member);
    }

    if (member.hasTag("nofreeze")) {
        member.removeTag("nofreeze");
        return TickFreeze(member);
    }
}
