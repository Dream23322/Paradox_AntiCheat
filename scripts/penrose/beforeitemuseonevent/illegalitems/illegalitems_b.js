import { world, Player, ItemStack, Items, MinecraftItemTypes, MinecraftEnchantmentTypes, Enchantment } from "mojang-minecraft";
import { illegalitems } from "../../../data/itemban.js";
import { crypto, flag, sendMsg, sendMsgToPlayer, titleCase, toCamelCase } from "../../../util.js";
import config from "../../../data/config.js";
import { enchantmentSlot } from "../../../data/enchantments.js";
import salvageable from "../../../data/salvageable.js";
import { whitelist } from "../../../data/whitelistitems.js";

const World = world;

function rip(source, item, enchant_data) {
    let tags = source.getTags();

    // This removes old ban tags
    tags.forEach(t => {
        if(t.startsWith("Reason:")) {
            source.removeTag(t);
        }
        if(t.startsWith("By:")) {
            source.removeTag(t);
        }
    });
    if (!enchant_data) {
        try {
            source.addTag('Reason:Illegal Item B (' + item.id.replace("minecraft:", "") + '=' + item.amount + ')');
            source.addTag('By:Paradox');
            source.addTag('isBanned');
        } catch (error) {
            source.triggerEvent('paradox:kick');
        }
    } else {
        try {
            source.addTag('Reason:Illegal Item B (' + item.id.replace("minecraft:", "") + ':' + enchant_data.type.id + '=' + enchant_data.level + ')');
            source.addTag('By:Paradox');
            source.addTag('isBanned');
        } catch (error) {
            source.triggerEvent('paradox:kick');
        }
    }
}

function illegalitemsb(object) {
    // Get Dynamic Property
    let illegalItemsBBoolean = World.getDynamicProperty('illegalitemsb_b');
    if (illegalItemsBBoolean === undefined) {
        illegalItemsBBoolean = config.modules.illegalitemsB.enabled;
    }
    let salvageBoolean = World.getDynamicProperty('salvage_b');
    if (salvageBoolean === undefined) {
        salvageBoolean = config.modules.salvage.enabled;
    }
    let illegalLoresBoolean = World.getDynamicProperty('illegallores_b');
    if (illegalLoresBoolean === undefined) {
        illegalLoresBoolean = config.modules.illegalLores.enabled;
    }
    let illegalEnchantmentBoolean = World.getDynamicProperty('illegalenchantment_b');
    if (illegalEnchantmentBoolean === undefined) {
        illegalEnchantmentBoolean = config.modules.illegalEnchantment.enabled;
    }
    let antiShulkerBoolean = World.getDynamicProperty('antishulker_b');
    if (antiShulkerBoolean === undefined) {
        antiShulkerBoolean = config.modules.antishulker.enabled;
    }
    let stackBanBoolean = World.getDynamicProperty('stackban_b');
    if (stackBanBoolean === undefined) {
        stackBanBoolean = config.modules.stackBan.enabled;
    }
    // Unsubscribe if disabled in-game
    if (illegalItemsBBoolean === false) {
        World.events.beforeItemUseOn.unsubscribe(illegalitemsb);
        return;
    }

    // Properties from class
    let { item, source, cancel } = object;

    // Check for hash/salt and validate password
    let hash = source.getDynamicProperty('hash');
    let salt = source.getDynamicProperty('salt');
    let encode;
    try {
        encode = crypto(salt, config.modules.encryption.password);
    } catch (error) {}
    // Return if player is OP
    if (hash !== undefined && encode === hash) {
        return;
    }

    // Only fire if entity is a Player
    if (!(source instanceof Player)) {
        return;
    }

    // Used for getting some info on the item
    if (config.debug) {
        source.runCommand(`say Item: ${item.id}, Data: ${item.data}, Amount: ${item.amount}`);
    }

    let hand = source.selectedSlot;

    // If shulker boxes are not allowed in the server then we handle this here
    // No need to ban when we can just remove it entirely and it's not officially listed as an illegal item at this moment
    if (antiShulkerBoolean && item.id === "minecraft:shulker_box" || antiShulkerBoolean && item.id === "minecraft:undyed_shulker_box") {
        cancel = true;
        source.getComponent('minecraft:inventory').container.setItem(hand, new ItemStack(MinecraftItemTypes.air, 0));
        sendMsg('@a[tag=notify]', `§r§4[§6Paradox§4]§r Removed ${item.id.replace("minecraft:", "")} from ${source.nameTag}.`)
        sendMsgToPlayer(source, `§r§4[§6Paradox§4]§r Shulker Boxes are not allowed!`)
        return;
    }

    if (salvageBoolean && !whitelist.includes(item.id)) {
        /**
         * Salvage System to mitigate NBT's on every item in the game
         */
        try {
            let enchantArray = [];
            let enchantLevelArray = [];
            let verifiedItemName = item.nameTag;
            let newNameTag = titleCase(item.id.replace("minecraft:", ""));
            let actualItemName = new ItemStack(Items.get(item.id));
            actualItemName.data = item.data;
            actualItemName.amount = item.amount;
            actualItemName.nameTag = newNameTag;

            if (verifiedItemName !== newNameTag) {
                // Gets enchantment component
                let ench_comp = item.getComponent("minecraft:enchantments");
                // Gets enchantment list from enchantment
                let ench_data = ench_comp.enchantments;

                // List of allowed enchantments on item
                let enchantedSlot = enchantmentSlot[ench_data.slot];
                // Check if enchantment is not illegal on item
                if (ench_data) {
                    for (let enchants in MinecraftEnchantmentTypes) {
                        // If no enchantment then move to next loop
                        let enchanted = MinecraftEnchantmentTypes[enchants];
                        if (!ench_data.hasEnchantment(enchanted)) {
                            continue;
                        }
                        // Get properties of this enchantment
                        let enchant_data = ench_data.getEnchantment(MinecraftEnchantmentTypes[enchants]);
                        // Is this item allowed to have this enchantment and does it not exceed level limitations
                        let enchantLevel = enchantedSlot[enchants];
                        if (enchantLevel && enchant_data && enchant_data.level <= enchantLevel && enchant_data.level  >= 0) {
                            // Save this enchantment and level for new item
                            let changeCase = toCamelCase(enchants);
                            enchantArray.push(changeCase);
                            enchantLevelArray.push(enchant_data.level);
                            
                        }
                    }
                }

                // Gets enchantment component for new instance
                let new_ench_comp = actualItemName.getComponent("minecraft:enchantments");
                // Gets enchantment list from enchantment of new instance
                let new_ench_data = new_ench_comp.enchantments;

                // Both arrays should be inline with each other so we just use enchantArray here
                // Add enchantment and corresponding level to the item
                for (let e = 0; e < enchantArray.length; e++) {
                    // Adds enchantment to enchantment list of new instance
                    new_ench_data.addEnchantment(new Enchantment(MinecraftEnchantmentTypes[enchantArray[e]], enchantLevelArray[e]));
                    // Sets enchantment list to enchantment of new instance
                    new_ench_comp.enchantments = new_ench_data;
                }
                // Restore enchanted item
                if (!illegalLoresBoolean) {
                    let loreData = item.getLore();
                    try {
                        actualItemName.setLore(loreData)
                        source.getComponent('minecraft:inventory').container.setItem(hand, actualItemName);
                    } catch (error) {}
                } else if (illegalLoresBoolean) {
                    try {
                        source.getComponent('minecraft:inventory').container.setItem(hand, actualItemName);
                    } catch (error) {}
                }
                if (config.debug) {
                    console.warn(`${newNameTag} has been set and verified by Paradox (illegalitems/B)!`);
                }
            }
        } catch (error) {}
    } else {
        // Used to contain data about Lores
        let loreData;
        // Check if item is salvageable and save it
        let uniqueItems = ["minecraft:potion", "minecraft:splash_potion", "minecraft:lingering_potion", "minecraft:skull"];
        // Check if data exceeds vanilla data
        if (salvageable[item.id] && uniqueItems.indexOf(salvageable[item.id].name) !== -1 && salvageable[item.id].data < item.data) {
            // Reset item to data type of 0
            if (!illegalLoresBoolean) {
                loreData = item.getLore();
                try {
                    const newItem = new ItemStack(Items.get(item.id), item.amount)
                    newItem.setLore(loreData)
                    source.getComponent('minecraft:inventory').container.setItem(hand, newItem);
                } catch (error) {}
                return;
            }
            try {
                source.getComponent('minecraft:inventory').container.setItem(hand, new ItemStack(Items.get(item.id), item.amount));
            } catch (error) {}
            return;
        } else if (salvageable[item.id] && salvageable[item.id].data !== item.data && uniqueItems.indexOf(salvageable[item.id].name) === -1) {
            // Reset item to data type of equal data if they do not match
            if (!illegalLoresBoolean) {
                loreData = item.getLore();
                try {
                    const newItem = new ItemStack(Items.get(item.id), item.amount, salvageable[item.id].data)
                    newItem.setLore(loreData)
                    source.getComponent('minecraft:inventory').container.setItem(hand, newItem);
                } catch (error) {}
                return;
            }
            try {
                source.getComponent('minecraft:inventory').container.setItem(hand, new ItemStack(Items.get(item.id), item.amount, salvageable[item.id].data));
            } catch (error) {}
            return;
        } else if (salvageable[item.id]) {
            // Reset item to data type of equal data because we take no chances
            if (!illegalLoresBoolean) {
                loreData = item.getLore();
                try {
                    const newItem = new ItemStack(Items.get(item.id), item.amount, item.data)
                    newItem.setLore(loreData)
                    source.getComponent('minecraft:inventory').container.setItem(hand, newItem);
                } catch (error) {}
                return;
            }
            try {
                source.getComponent('minecraft:inventory').container.setItem(hand, new ItemStack(Items.get(item.id), item.amount, item.data));
            } catch (error) {}
            return;
        }
    }

    // If somehow they bypass illegalitems/A then snag them when they use the item
    if (illegalitems.includes(item.id)) {
        cancel = true;
        flag(source, "IllegalItems", "B", "Exploit", item.id, item.amount, false, false, false, false);
        source.getComponent('minecraft:inventory').container.setItem(hand, new ItemStack(MinecraftItemTypes.air, 0));
        // Ban
        return rip(source, item, false);
    }
    // Check if item exceeds allowed stacks then remove and ban if enabled
    if (item.amount > config.modules.illegalitemsB.maxStack) {
        cancel = true;
        // Item stacks over 64 we remove
        try {
            source.getComponent('minecraft:inventory').container.setItem(hand, new ItemStack(MinecraftItemTypes.air, 0));
            sendMsg('@a[tag=notify]', `§r§4[§6Paradox§4]§r ${source.nameTag}§r detected with stacked items greater than x64.`)
            sendMsgToPlayer(source, `§r§4[§6Paradox§4]§r Stacked items cannot exceed x64!`)
        } catch (error) {}
        if (stackBanBoolean) {
            // Ban
            return rip(source, item, false);
        } else {
            return;
        }
    }
    // Check items for illegal lores
    if (illegalLoresBoolean && !config.modules.illegalLores.exclude.includes(String(item.getLore()))) {
        cancel = true;
        try {
            source.getComponent('minecraft:inventory').container.setItem(hand, new ItemStack(MinecraftItemTypes.air, 0));
        } catch {}
        sendMsg('@a[tag=notify]', `§r§4[§6Paradox§4]§r Removed ${item.id.replace("minecraft:", "")} with lore from ${source.nameTag}.`)
        sendMsgToPlayer(source, `§r§4[§6Paradox§4]§r Item with illegal lores are not allowed!`)
        return;
    }
    if (illegalEnchantmentBoolean) {
        // We get a list of enchantments on this item
        let item_enchants = item.getComponent("minecraft:enchantments").enchantments;
        // List of allowed enchantments on item
        let enchantedSlot = enchantmentSlot[item_enchants.slot];
        // Check if enchantment is illegal on item
        if (item_enchants) {
            for (let enchants in MinecraftEnchantmentTypes) {
                // If no enchantment then move to next loop
                let enchanted = MinecraftEnchantmentTypes[enchants];
                if (!item_enchants.hasEnchantment(enchanted)) {
                    continue;
                }
                // Get properties of this enchantment
                let enchant_data = item_enchants.getEnchantment(MinecraftEnchantmentTypes[enchants]);
                // Is this item allowed to have this enchantment
                let enchantLevel = enchantedSlot[enchants];
                if (!enchantLevel) {
                    cancel = true;
                    flag(source, "IllegalItems", "B", "Exploit", item.id, item.amount, false, false, false, false);
                    // Remove this item immediately
                    source.getComponent('minecraft:inventory').container.setItem(hand, new ItemStack(MinecraftItemTypes.air, 0));
                    sendMsg('@a[tag=notify]', [
                        `§r§4[§6Paradox§4]§r §4[§f${source.nameTag}§4]§r §6=>§r §4[§fSlot§4]§r ${hand}§r §6=>§r §4[§f${item.id.replace("minecraft:", "")}§4]§r §6Enchanted: §4${enchant_data.type.id}=${enchant_data.level}§r`,,
                        `§r§4[§6Paradox§4]§r Removed §4[§f${item.id.replace("minecraft:", "")}§4]§r from ${source.nameTag}.`
                    ])
                    sendMsgToPlayer(source, `§r§4[§6Paradox§4]§r Illegal enchantments are not allowed!`)
                    rip(source, item, enchant_data);
                    break;
                }
                // Does the enchantment type exceed or break vanilla levels
                if (enchant_data && enchant_data.level > enchantLevel || enchant_data && enchant_data.level < 0) {
                    cancel = true;
                    flag(source, "IllegalItems", "B", "Exploit", item.id, item.amount, false, false, false, false);
                    // Remove this item immediately
                    source.getComponent('minecraft:inventory').container.setItem(hand, new ItemStack(MinecraftItemTypes.air, 0));
                    sendMsg('@a[tag=notify]', [
                        `§r§4[§6Paradox§4]§r §4[§f${source.nameTag}§4]§r §6=>§r §4[§fSlot§4]§r ${hand}§r §6=>§r §4[§f${item.id.replace("minecraft:", "")}§4]§r §6Enchanted: §4${enchant_data.type.id}=${enchant_data.level}§r`,
                        `§r§4[§6Paradox§4]§r Removed §4[§f${item.id.replace("minecraft:", "")}§4]§r from ${source.nameTag}.`
                    ])
                    sendMsgToPlayer(source, `§r§4[§6Paradox§4]§r Illegal enchantments are not allowed!`)
                    rip(source, item, enchant_data);
                    break;
                }
            }
        }
    }
}

const IllegalItemsB = () => {
    World.events.beforeItemUseOn.subscribe(illegalitemsb);
};

export { IllegalItemsB };
