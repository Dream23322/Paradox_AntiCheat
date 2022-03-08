import * as Minecraft from "mojang-minecraft";
import { flag } from "../../../util.js";
import config from "../../../data/config.js";
import { setTickInterval } from "../../../timer/scheduling.js";

const World = Minecraft.world;

function noslowa() {
    // Unsubscribe if disabled in-game
    if (config.modules.noslowA.enabled === false) {
        World.events.tick.unsubscribe(noslowa);
        return;
    }
    // run as each player
    for (let player of World.getPlayers()) {
        const speedcheck = player.getComponent('minecraft:movement');
        // Check the players current speed and see if it exceeds the value we have hardcoded
        // If they do not have the effect for speed then we flag and reset their speed to the default value.
        if (speedcheck.current >= config.modules.noslowA.speed && !player.getEffect(Minecraft.MinecraftEffectTypes.speed) && !player.hasTag('paradoxOpped')) {
            let speedrecord = speedcheck.current;
            flag(player, "NoSlow", "A", "Movement", "IllegalSpeed", (speedrecord).toFixed(3), true, false);
            speedcheck.setCurrent(speedcheck.value);
        }
    }
}

const NoSlowA = () => {
    // Executes every 2 seconds
    setTickInterval(() => noslowa(), 40);
};

export { NoSlowA };