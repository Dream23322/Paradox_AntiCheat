import { BlockBreakEvent, dynamicPropertyRegistry, sendMsg, world, xrayblocks } from "../../../index";

function xraya(object: BlockBreakEvent) {
    // Get Dynamic Property
    const xrayBoolean = dynamicPropertyRegistry.get("xraya_b");

    // Unsubscribe if disabled in-game
    if (xrayBoolean === false) {
        world.events.blockBreak.unsubscribe(xraya);
        return;
    }

    // Properties from class
    const { player, brokenBlockPermutation } = object;

    // Get unique ID
    const uniqueId = dynamicPropertyRegistry.get(player?.scoreboard?.id);

    // Skip if they have permission
    if (uniqueId === player.name) {
        return;
    }

    // Player coordinates
    const { x, y, z } = player.location;

    if (brokenBlockPermutation.type.id in xrayblocks) {
        sendMsg(`@a[tag=notify]`, `§r§4[§6Paradox§4]§r §4[Xray]§r ${player.nameTag}§r§6 has found §r1x ${brokenBlockPermutation.type.id.replace("minecraft:", "")}§6 at X=§r${x.toFixed(0)}§6 Y=§r${y.toFixed(0)}§6 Z=§r${z.toFixed(0)}.`);
    }
}

const XrayA = () => {
    world.events.blockBreak.subscribe(xraya);
};

export { XrayA };
