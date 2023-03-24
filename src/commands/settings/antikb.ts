import { AntiKnockbackA, BeforeChatEvent, config, dynamicPropertyRegistry, getPrefix, getScore, Player, sendMsg, sendMsgToPlayer, world } from "../../index";

function antikbHelp(player: Player, prefix: string, antikbBoolean: string | number | boolean) {
    let commandStatus: string;
    if (!config.customcommands.antikb) {
        commandStatus = "§6[§4DISABLED§6]§r";
    } else {
        commandStatus = "§6[§aENABLED§6]§r";
    }
    let moduleStatus: string;
    if (antikbBoolean === false) {
        moduleStatus = "§6[§4DISABLED§6]§r";
    } else {
        moduleStatus = "§6[§aENABLED§6]§r";
    }
    return sendMsgToPlayer(player, [
        `\n§4[§6Command§4]§r: antikb`,
        `§4[§6Status§4]§r: ${commandStatus}`,
        `§4[§6Module§4]§r: ${moduleStatus}`,
        `§4[§6Usage§4]§r: antikb [optional]`,
        `§4[§6Optional§4]§r: help`,
        `§4[§6Description§4]§r: Toggles Anti Knockback for all players.`,
        `§4[§6Examples§4]§r:`,
        `    ${prefix}antikb`,
        `    ${prefix}antikb help`,
    ]);
}

/**
 * @name antiknockback
 * @param {BeforeChatEvent} message - Message object
 * @param {string[]} args - Additional arguments provided (optional).
 */
export async function antiknockback(message: BeforeChatEvent, args: string[]) {
    // validate that required params are defined
    if (!message) {
        return console.warn(`${new Date()} | ` + "Error: ${message} isnt defined. Did you forget to pass it? (./commands/settings/antikb.js:36)");
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
    const antikbBoolean = dynamicPropertyRegistry.get("antikb_b");

    // Check for custom prefix
    const prefix = getPrefix(player);

    // Was help requested
    const argCheck = args[0];
    if ((argCheck && args[0].toLowerCase() === "help") || !config.customcommands.antikb) {
        return antikbHelp(player, prefix, antikbBoolean);
    }

    const antikbscore = getScore("antikb", player);

    if (antikbscore <= 0) {
        // Allow
        dynamicPropertyRegistry.set("antikb_b", true);
        world.setDynamicProperty("antikb_b", true);
        await player.runCommandAsync(`scoreboard players set paradox:config antikb 1`);
        sendMsg("@a[tag=paradoxOpped]", `§r§4[§6Paradox§4]§r ${player.nameTag}§r has enabled §6Anti Knockback§r!`);
        AntiKnockbackA();
    } else if (antikbscore >= 1) {
        // Deny
        dynamicPropertyRegistry.set("antikb_b", false);
        world.setDynamicProperty("antikb_b", false);
        await player.runCommandAsync(`scoreboard players set paradox:config antikb 0`);
        sendMsg("@a[tag=paradoxOpped]", `§r§4[§6Paradox§4]§r ${player.nameTag}§r has disabled §4Anti Knockback§r!`);
    }
    return await player.runCommandAsync(`scoreboard players operation @a antikb = paradox:config antikb`);
}
