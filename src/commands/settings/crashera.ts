import { getPrefix, sendMsg, sendMsgToPlayer } from "../../util.js";
import config from "../../data/config.js";
import { ChatSendAfterEvent, Player, world } from "@minecraft/server";
import { CrasherA } from "../../penrose/TickEvent/crasher/crasher_a.js";
import { dynamicPropertyRegistry } from "../../penrose/WorldInitializeAfterEvent/registry.js";

function crasheraHelp(player: Player, prefix: string, crasherABoolean: string | number | boolean) {
    let commandStatus: string;
    if (!config.customcommands.crashera) {
        commandStatus = "§6[§4DISABLED§6]§r";
    } else {
        commandStatus = "§6[§aENABLED§6]§r";
    }
    let moduleStatus: string;
    if (crasherABoolean === false) {
        moduleStatus = "§6[§4DISABLED§6]§r";
    } else {
        moduleStatus = "§6[§aENABLED§6]§r";
    }
    return sendMsgToPlayer(player, [
        `\n§4[§6Command§4]§r: crashera`,
        `§4[§6Status§4]§r: ${commandStatus}`,
        `§4[§6Module§4]§r: ${moduleStatus}`,
        `§4[§6Usage§4]§r: crashera [optional]`,
        `§4[§6Optional§4]§r: help`,
        `§4[§6Description§4]§r: Toggles checks for the infamous Horion Crasher.`,
        `§4[§6Examples§4]§r:`,
        `    ${prefix}crashera`,
        `    ${prefix}crashera help`,
    ]);
}

/**
 * @name crasherA
 * @param {ChatSendAfterEvent} message - Message object
 * @param {string[]} args - Additional arguments provided (optional).
 */
export function crasherA(message: ChatSendAfterEvent, args: string[]) {
    // validate that required params are defined
    if (!message) {
        return console.warn(`${new Date()} | ` + "Error: ${message} isnt defined. Did you forget to pass it? (./commands/settings/crashera.js:36)");
    }

    const player = message.sender;

    // Get unique ID
    const uniqueId = dynamicPropertyRegistry.get(player?.id);

    // Make sure the user has permissions to run the command
    if (uniqueId !== player.name) {
        return sendMsgToPlayer(player, `§r§4[§6Paradox§4]§r You need to be Paradox-Opped to use this command.`);
    }

    // Get Dynamic Property Boolean
    const crasherABoolean = dynamicPropertyRegistry.get("crashera_b");

    // Check for custom prefix
    const prefix = getPrefix(player);

    // Was help requested
    const argCheck = args[0];
    if ((argCheck && args[0].toLowerCase() === "help") || !config.customcommands.crashera) {
        return crasheraHelp(player, prefix, crasherABoolean);
    }

    if (crasherABoolean === false) {
        // Allow
        dynamicPropertyRegistry.set("crashera_b", true);
        world.setDynamicProperty("crashera_b", true);
        sendMsg("@a[tag=paradoxOpped]", `§r§4[§6Paradox§4]§r ${player.nameTag}§r has enabled §6CrasherA§r!`);
        CrasherA();
    } else if (crasherABoolean === true) {
        // Deny
        dynamicPropertyRegistry.set("crashera_b", false);
        world.setDynamicProperty("crashera_b", false);
        sendMsg("@a[tag=paradoxOpped]", `§r§4[§6Paradox§4]§r ${player.nameTag}§r has disabled §4CrasherA§r!`);
    }
}
