import { Player, world } from "@minecraft/server";
import { ModalFormResponse } from "@minecraft/server-ui";
import { dynamicPropertyRegistry } from "../../penrose/WorldInitializeAfterEvent/registry";
import { sendMsg, sendMsgToPlayer } from "../../util";
import { paradoxui } from "../paradoxui.js";
import { KillAura } from "../../penrose/EntityHitEntityAfterEvent/killaura";

/**
 * Handles the result of a modal form used for toggling anti-kill aura mode.
 *
 * @name uiANTIKILLAURA
 * @param {ModalFormResponse} antikillauraResult - The result of the anti-kill aura mode toggle modal form.
 * @param {Player} player - The player who triggered the anti-kill aura mode toggle modal form.
 */
export function uiANTIKILLAURA(antikillauraResult: ModalFormResponse, player: Player) {
    handleUIAntiKillAura(antikillauraResult, player).catch((error) => {
        console.error("Paradox Unhandled Rejection: ", error);
    });
}

async function handleUIAntiKillAura(antikillauraResult: ModalFormResponse, player: Player) {
    const [AntiKillAuraToggle] = antikillauraResult.formValues;
    // Get unique ID
    const uniqueId = dynamicPropertyRegistry.get(player?.id);

    // Get Dynamic Property Boolean

    // Make sure the user has permissions to run the command
    if (uniqueId !== player.name) {
        return sendMsgToPlayer(player, `§f§4[§6Paradox§4]§f You need to be Paradox-Opped to configure Anti Killaura`);
    }
    if (AntiKillAuraToggle === false) {
        // Deny
        dynamicPropertyRegistry.set("antikillaura_b", false);
        world.setDynamicProperty("antikillaura_b", false);
        sendMsg("@a[tag=paradoxOpped]", `§f§4[§6Paradox§4]§f ${player.name}§f has disabled §4AntiKillAura§f!`);
    } else if (AntiKillAuraToggle === true) {
        // Allow
        dynamicPropertyRegistry.set("antikillaura_b", true);
        world.setDynamicProperty("antikillaura_b", true);
        sendMsg("@a[tag=paradoxOpped]", `§f§4[§6Paradox§4]§f ${player.name}§f has enabled §6AntiKillAura§f!`);
        KillAura();
    }
    //show the main ui to the player once complete.
    return paradoxui(player);
}
