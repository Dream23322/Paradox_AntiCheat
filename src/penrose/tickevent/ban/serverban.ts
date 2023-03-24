import { banMessage, EntityQueryOptions, sendMsg, sendMsgToPlayer, system, world } from "../../../index";
import { queueUnban } from "../../../command_index";

function serverban() {
    const filter = new Object() as EntityQueryOptions;
    filter.tags = ["isBanned"];
    // run as each player
    for (const player of world.getPlayers(filter)) {
        if (queueUnban.has(player.nameTag)) {
            // Remove tag
            player.removeTag("isBanned");

            const tags = player.getTags();

            // This removes old ban stuff
            tags.forEach((t) => {
                if (t.startsWith("Reason:")) {
                    player.removeTag(t);
                }
                if (t.startsWith("By:")) {
                    player.removeTag(t);
                }
            });

            // Remove player from queue
            queueUnban.delete(player.nameTag);

            // Let staff and player know they are unbanned
            sendMsgToPlayer(player, `§r§4[§6Paradox§4]§r You have been unbanned.`);
            sendMsg(`@a[tag=paradoxOpped]`, `§r§4[§6Paradox§4]§r ${player.nameTag} has been unbanned.`);
            continue;
        }
        // Ban message
        else banMessage(player);
    }
}

/**
 * We store the identifier in a variable
 * to cancel the execution of this scheduled run
 * if needed to do so.
 */
export const ServerBan = system.runInterval(() => {
    serverban();
}, 40);
