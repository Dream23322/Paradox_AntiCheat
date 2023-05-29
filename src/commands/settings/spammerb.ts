import { getPrefix, sendMsg, sendMsgToPlayer } from "../../util.js";
import config from "../../data/config.js";
import { ChatSendAfterEvent, Player, world } from "@minecraft/server";
import { SpammerB } from "../../penrose/ChatSendBeforeEvent/spammer/spammer_b.js";
import { dynamicPropertyRegistry } from "../../penrose/WorldInitializeAfterEvent/registry.js";

function spammerBHelp(player: Player, prefix: string, spammerBBoolean: string | number | boolean) {
    let commandStatus: string;
    if (!config.customcommands.spammerb) {
        commandStatus = "§6[§4DISABLED§6]§r";
    } else {
        commandStatus = "§6[§aENABLED§6]§r";
    }
    let moduleStatus: string;
    if (spammerBBoolean === false) {
        moduleStatus = "§6[§4DISABLED§6]§r";
    } else {
        moduleStatus = "§6[§aENABLED§6]§r";
    }
    return sendMsgToPlayer(player, [
        `\n§4[§6Command§4]§r: spammerb`,
        `§4[§6Status§4]§r: ${commandStatus}`,
        `§4[§6Module§4]§r: ${moduleStatus}`,
        `§4[§6Usage§4]§r: spammerb [optional]`,
        `§4[§6Optional§4]§r: help`,
        `§4[§6Description§4]§r: Toggles checks for messages sent while swinging.`,
        `§4[§6Examples§4]§r:`,
        `    ${prefix}spammerb`,
        `    ${prefix}spammerb help`,
    ]);
}

/**
 * @name spammerB
 * @param {ChatSendAfterEvent} message - Message object
 * @param {string[]} args - Additional arguments provided (optional).
 */
export function spammerB(message: ChatSendAfterEvent, args: string[]) {
    // validate that required params are defined
    if (!message) {
        return console.warn(`${new Date()} | ` + "Error: ${message} isnt defined. Did you forget to pass it? (./commands/settings/spammerb.js:36)");
    }

    const player = message.sender;

    // Get unique ID
    const uniqueId = dynamicPropertyRegistry.get(player?.id);

    // Make sure the user has permissions to run the command
    if (uniqueId !== player.name) {
        return sendMsgToPlayer(player, `§r§4[§6Paradox§4]§r You need to be Paradox-Opped to use this command.`);
    }

    // Get Dynamic Property Boolean
    const spammerBBoolean = dynamicPropertyRegistry.get("spammerb_b");

    // Check for custom prefix
    const prefix = getPrefix(player);

    // Was help requested
    const argCheck = args[0];
    if ((argCheck && args[0].toLowerCase() === "help") || !config.customcommands.spammerb) {
        return spammerBHelp(player, prefix, spammerBBoolean);
    }

    if (spammerBBoolean === false) {
        // Allow
        dynamicPropertyRegistry.set("spammerb_b", true);
        world.setDynamicProperty("spammerb_b", true);
        sendMsg("@a[tag=paradoxOpped]", `§r§4[§6Paradox§4]§r ${player.nameTag}§r has enabled §6SpammerB§r!`);
        SpammerB();
    } else if (spammerBBoolean === true) {
        // Deny
        dynamicPropertyRegistry.set("spammerb_b", false);
        world.setDynamicProperty("spammerb_b", false);
        sendMsg("@a[tag=paradoxOpped]", `§r§4[§6Paradox§4]§r ${player.nameTag}§r has disabled §4SpammerB§r!`);
    }
}
