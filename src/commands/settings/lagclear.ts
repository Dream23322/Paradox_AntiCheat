import { BeforeChatEvent, ClearLag, config, dynamicPropertyRegistry, getPrefix, Player, sendMsg, sendMsgToPlayer, world } from "../../index";

function clearlagHelp(player: Player, prefix: string, clearLagBoolean: string | number | boolean) {
    let commandStatus: string;
    if (!config.customcommands.clearlag) {
        commandStatus = "§6[§4DISABLED§6]§r";
    } else {
        commandStatus = "§6[§aENABLED§6]§r";
    }
    let moduleStatus: string;
    if (clearLagBoolean === false) {
        moduleStatus = "§6[§4DISABLED§6]§r";
    } else {
        moduleStatus = "§6[§aENABLED§6]§r";
    }
    return sendMsgToPlayer(player, [
        `\n§4[§6Command§4]§r: clearlag`,
        `§4[§6Status§4]§r: ${commandStatus}`,
        `§4[§6Module§4]§r: ${moduleStatus}`,
        `§4[§6Usage§4]§r: clearlag [optional]`,
        `§4[§6Optional§4]§r: help`,
        `§4[§6Description§4]§r: Clears items and entities with timer.`,
        `§4[§6Examples§4]§r:`,
        `    ${prefix}clearlag`,
        `    ${prefix}clearlag help`,
    ]);
}

/**
 * @name clearlag
 * @param {BeforeChatEvent} message - Message object
 * @param {srting[]} args - Additional arguments provided (optional).
 */
export function clearlag(message: BeforeChatEvent, args: string[]) {
    // validate that required params are defined
    if (!message) {
        return console.warn(`${new Date()} | ` + "Error: ${message} isnt defined. Did you forget to pass it? (./commands/settings/clearlag.js:36)");
    }

    message.cancel = true;

    const player = message.sender;

    // Get unique ID
    const uniqueId = dynamicPropertyRegistry.get(player?.scoreboard?.id);

    // Make sure the user has permissions to run the command
    if (uniqueId !== player.name) {
        return sendMsgToPlayer(player, `§r§4[§6Paradox§4]§r You need to be Paradox-Opped to use this command.`);
    }

    // Get Dynamic Property Boolean
    const clearLagBoolean = dynamicPropertyRegistry.get("clearlag_b");

    // Check for custom prefix
    const prefix = getPrefix(player);

    // Was help requested
    const argCheck = args[0];
    if ((argCheck && args[0].toLowerCase() === "help") || !config.customcommands.clearlag) {
        return clearlagHelp(player, prefix, clearLagBoolean);
    }

    if (clearLagBoolean === false) {
        // Allow
        dynamicPropertyRegistry.set("clearlag_b", true);
        world.setDynamicProperty("clearlag_b", true);
        sendMsg("@a[tag=paradoxOpped]", `§r§4[§6Paradox§4]§r ${player.nameTag}§r has enabled §6ClearLag§r!`);
        ClearLag();
    } else if (clearLagBoolean === true) {
        // Deny
        dynamicPropertyRegistry.set("clearlag_b", false);
        world.setDynamicProperty("clearlag_b", false);
        sendMsg("@a[tag=paradoxOpped]", `§r§4[§6Paradox§4]§r ${player.nameTag}§r has disabled §4ClearLag§r!`);
    }
}
