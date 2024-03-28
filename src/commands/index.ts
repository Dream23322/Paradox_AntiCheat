// index.ts (in commands directory)
import { CommandHandler } from "../classes/CommandHandler";
import { GameMode, system, world } from "@minecraft/server";
import { secretKey } from "../security/generateRandomKey";
import { opCommand } from "./moderation/op";
import { MinecraftEnvironment } from "../classes/container/Dependencies";
import { deopCommand } from "./moderation/deop";
import { punishCommand } from "./moderation/punish";
import { vanishCommand } from "./moderation/vanish";
import { prefixCommand } from "./moderation/prefix";

let checkKey = world.getDynamicProperty("securityKey");
if (!checkKey || typeof checkKey !== "string") {
    world.setDynamicProperty("securityKey", secretKey);
}

checkKey = null;

const minecraftEnvironment = MinecraftEnvironment.getInstance(world, system, GameMode);
const commandHandler = new CommandHandler(world.getDynamicProperty("securityKey") as string, minecraftEnvironment);

// Register commands with the CommandHandler
commandHandler.registerCommand([opCommand, deopCommand, punishCommand, vanishCommand, prefixCommand]);

export { commandHandler };
