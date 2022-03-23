import { world, EntityQueryOptions } from "mojang-minecraft";
import { banMessage } from "../../../util.js";
import { setTickInterval } from "../../../timer/scheduling.js";
import config from "../../../data/config.js";

const World = world;

function serverban() {
    // Unsubscribe if disabled in-game
    if (config.modules.unbanWindow.enabled === true) {
        World.events.tick.unsubscribe(serverban);
        return;
    }
    let tag = new EntityQueryOptions();
    tag.tags = ['isBanned'];
    // run as each player
    for (let player of World.getPlayers(tag)) {
        // Ban message
        banMessage(player);
    }
}

const ServerBan = () => {
    // Executes every 2 seconds
    setTickInterval(() => serverban(), 40);
};

export { ServerBan };