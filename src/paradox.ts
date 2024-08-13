import { chatSendSubscription } from "./classes/subscriptions/chat-send-subscriptions";
import { subscribeToWorldInitialize } from "./event-listeners/world-initialize";
import { CommandHandler } from "./classes/command-handler";
import { opCommand } from "./commands/moderation/op";
import { MinecraftEnvironment } from "./classes/container/dependencies";
import { deopCommand } from "./commands/moderation/deop";
import { punishCommand } from "./commands/moderation/punish";
import { vanishCommand } from "./commands/moderation/vanish";
import { prefixCommand } from "./commands/moderation/prefix";
import { despawnCommand } from "./commands/moderation/despawn";
import { kickCommand } from "./commands/moderation/kick";
import { lockdownCommand } from "./commands/moderation/lockdown";
import { tpaCommand } from "./commands/moderation/tpa";
import { homeCommand } from "./commands/utility/home";
import { onPlayerSpawn } from "./event-listeners/player-spawn";
import { invseeCommand } from "./commands/utility/invsee";
import { opsecCommand } from "./commands/moderation/opsec";
import { tprCommand } from "./commands/utility/tpr";
import { setRankCommand } from "./commands/utility/rank";
import { banCommand } from "./commands/moderation/ban";
import { unbanCommand } from "./commands/moderation/unban";
import { lagClearCommand } from "./commands/settings/lag-clear";
import { gameModeCommand } from "./commands/settings/game-mode";
import { worldBorderCommand } from "./commands/settings/world-border";
import { flyCheckCommand } from "./commands/settings/fly";
import { afkCommand } from "./commands/settings/afk";
import { antispamCommand } from "./commands/settings/spam";
import { pvpToggleCommand } from "./commands/utility/pvp";

// Subscribe to chat send events
chatSendSubscription.subscribe();

// Subscribe to world initialization events
subscribeToWorldInitialize();

// subscribe to player spawn events
onPlayerSpawn();

// Get the Minecraft environment instance
const minecraftEnvironment = MinecraftEnvironment.getInstance();

// Initialize the CommandHandler with the security key and Minecraft environment
const commandHandler = new CommandHandler(minecraftEnvironment);

// Register commands with the CommandHandler
commandHandler.registerCommand([
    opCommand,
    deopCommand,
    punishCommand,
    vanishCommand,
    prefixCommand,
    despawnCommand,
    kickCommand,
    lockdownCommand,
    tpaCommand,
    homeCommand,
    invseeCommand,
    opsecCommand,
    tprCommand,
    setRankCommand,
    banCommand,
    unbanCommand,
    lagClearCommand,
    gameModeCommand,
    worldBorderCommand,
    flyCheckCommand,
    afkCommand,
    antispamCommand,
    pvpToggleCommand,
]);

export { commandHandler };
