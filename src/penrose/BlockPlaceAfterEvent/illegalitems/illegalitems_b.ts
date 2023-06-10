import { world, ItemStack, Enchantment, Player, Block, BlockPlaceAfterEvent, BlockInventoryComponent, ItemEnchantsComponent, EnchantmentList } from "@minecraft/server";
import { illegalitems } from "../../../data/itemban.js";
import config from "../../../data/config.js";
import { flag, titleCase, sendMsgToPlayer, sendMsg } from "../../../util.js";
import { kickablePlayers } from "../../../kickcheck.js";
import { dynamicPropertyRegistry } from "../../WorldInitializeAfterEvent/registry.js";
import { illegalItemsBWhitelist } from "../../../data/illegalItemsB_whitelist.js";

function rip(player: Player, inventory_item: ItemStack, enchData?: { id: string; level: number }, block?: Block) {
    let reason: string;
    if (block) {
        reason = `Illegal Item B (${block.type.id.replace("minecraft:", "")})`;
    } else if (enchData) {
        const { id, level } = enchData;
        reason = `Illegal Item B (${inventory_item.typeId.replace("minecraft:", "")}: ${id}=${level})`;
    } else {
        reason = `Illegal Item B (${inventory_item.typeId.replace("minecraft:", "")}=${inventory_item.amount})`;
    }

    try {
        player.addTag(`Reason:${reason}`);
        player.addTag("By:Paradox");
        player.addTag("isBanned");
    } catch (error) {
        kickablePlayers.add(player);
        player.triggerEvent("paradox:kick");
    }
}

async function illegalitemsb(object: BlockPlaceAfterEvent) {
    // Get Dynamic Property
    const illegalItemsBBoolean = dynamicPropertyRegistry.get("illegalitemsb_b");
    const salvageBoolean = dynamicPropertyRegistry.get("salvage_b");
    const illegalLoresBoolean = dynamicPropertyRegistry.get("illegallores_b");
    const illegalEnchantmentBoolean = dynamicPropertyRegistry.get("illegalenchantment_b");
    const antiShulkerBoolean = dynamicPropertyRegistry.get("antishulker_b");
    const stackBanBoolean = dynamicPropertyRegistry.get("stackban_b");

    // Unsubscribe if disabled in-game
    if (illegalItemsBBoolean === false) {
        world.afterEvents.blockPlace.unsubscribe(illegalitemsb);
        return;
    }

    // Properties from class
    const { block, player } = object;
    // Block coordinates
    const { x, y, z } = block.location;

    // Get the player's unique ID from the "dynamicPropertyRegistry" object
    const uniqueId = dynamicPropertyRegistry.get(player?.id);

    // If the player has permission (i.e., their unique ID matches their name), skip to the next player
    if (uniqueId === player.name) {
        return;
    }

    // Create a map of enchantment types and their presence in the player's inventory
    const enchantmentPresenceMap = new Map<Enchantment, boolean>();
    // Create a map of enchantment types and their data in the player's inventory
    const enchantmentDataMap = new Map<Enchantment, EnchantmentList>();
    // Create a map of enchantment types and a number type to signify slot value
    const inventorySlotMap = new Map<Enchantment, number>();
    // Create a map of enchantment types and a ItemStack type to test new instance of ItemStack type
    const itemStackDataMap = new Map<Enchantment, ItemStack>();
    // Create a map of itemstack types not verified by Paradox
    const unverifiedItemMap = new Map<number, ItemStack>();

    // Check if placed item is illegal
    if (illegalitems.has(block.typeId) && !illegalItemsBWhitelist.has(block.typeId)) {
        await player.runCommandAsync(`fill ${x} ${y} ${z} ${x} ${y} ${z} air [] replace air`);
        flag(player, "IllegalItems", "B", "Exploit", null, null, null, null, null);
        return rip(player, null, null, block);
    }

    // Get the block's inventory
    const blockInventory = block.getComponent("minecraft:inventory") as BlockInventoryComponent;
    const blockContainer = blockInventory?.container;
    const blockIdentifiers = ["ender_chest", "shulker"];
    let isFlagged = false;
    let isAdjacent = false;
    // Check if container illegally contains nested items if not an ender chest or shulker box
    if (!blockIdentifiers.some((id) => block.typeId.indexOf(id) !== -1)) {
        if (blockContainer) {
            // Cache the block's inventory size
            const blockContainerSize = blockContainer.size;

            // Iterate through each slot in the block's container
            for (let i = 0; i < blockContainerSize; i++) {
                // Get the item in the current slot
                const blockItemStack = blockContainer.getItem(i);
                const itemStackId = blockItemStack?.typeId;
                if (!itemStackId) {
                    continue;
                }
                // Check if its a chest adjacent to another chest
                if (block.typeId === "minecraft:chest" || block.typeId === "minecraft:trapped_chest") {
                    const adjacentBlocks = [
                        { dx: 1, dy: 0, dz: 0 }, // east
                        { dx: -1, dy: 0, dz: 0 }, // west
                        { dx: 0, dy: 1, dz: 0 }, // up
                        { dx: 0, dy: -1, dz: 0 }, // down
                        { dx: 0, dy: 0, dz: 1 }, // north
                        { dx: 0, dy: 0, dz: -1 }, // south
                    ];

                    for (const { dx, dy, dz } of adjacentBlocks) {
                        const blockUp = world.getDimension("overworld").getBlock({ x: block.location.x + dx, y: block.location.y + dy, z: block.location.z + dz });
                        if (blockUp.typeId === "minecraft:chest" || blockUp.typeId === "minecraft:trapped_chest") {
                            // The new chest is adjacent to an existing chest
                            isAdjacent = true;
                            break;
                        }
                    }
                }
                if (isAdjacent) {
                    break;
                }
                // Nested item has been found so flag it and remove the block from the world
                await player.runCommandAsync(`fill ${x} ${y} ${z} ${x} ${y} ${z} air [] replace air`);
                flag(player, "IllegalItems", "B", "Exploit", null, null, null, null, null);
                rip(player, null, null, block);
                isFlagged = true;
                break;
            }
        }
        if (isFlagged) {
            return;
        }
    }

    if (blockIdentifiers.some((id) => block.typeId.indexOf(id) !== -1) || isAdjacent) {
        // Check shulker boxes and ender chests for illegal nested items
        if (blockContainer) {
            // Cache the block's inventory size
            const blockContainerSize = blockContainer.size;
            // Iterate through each slot in the player's container
            for (let i = 0; i < blockContainerSize; i++) {
                // Get the item in the current slot
                const blockItemStack = blockContainer.getItem(i);
                const itemStackId = blockItemStack?.typeId;
                if (!itemStackId) {
                    continue;
                }

                // Anti Shulker Boxes
                if (antiShulkerBoolean && itemStackId.includes("shulker")) {
                    blockContainer.setItem(i);
                    sendMsg("@a[tag=notify]", `§r§4[§6Paradox§4]§r Removed ${block.typeId.replace("minecraft:", "")} from ${player.name}.`);
                    sendMsgToPlayer(player, `§r§4[§6Paradox§4]§r Shulker Boxes are not allowed!`);
                    continue;
                }

                // Illegal Stacks
                const currentStack = blockItemStack.amount;
                const maxStack = blockItemStack.maxAmount;
                if (stackBanBoolean && currentStack > maxStack) {
                    blockContainer.setItem(i);
                    sendMsg("@a[tag=notify]", `§r§4[§6Paradox§4]§r Removed ${itemStackId.replace("minecraft:", "")} x ${currentStack} from ${player.name}.`);
                    sendMsgToPlayer(player, `§r§4[§6Paradox§4]§r Illegal Stacks are not allowed!`);
                    rip(player, blockItemStack, null, block);
                    isFlagged = true;
                    break;
                }

                // If the item is in the "illegalitems" object, remove it from the block's inventory and run the "rip" function on it
                if (itemStackId in illegalitems) {
                    blockContainer.setItem(i);
                    sendMsg("@a[tag=notify]", `§r§4[§6Paradox§4]§r Removed ${itemStackId.replace("minecraft:", "")} from ${player.name}.`);
                    sendMsgToPlayer(player, `§r§4[§6Paradox§4]§r Illegal Items are not allowed!`);
                    rip(player, blockItemStack, null, block);
                    isFlagged = true;
                    break;
                }

                // Illegal Lores
                if (illegalLoresBoolean && !config.modules.illegalLores.exclude.includes(String(blockItemStack.getLore()))) {
                    blockContainer.setItem(i);
                    sendMsg("@a[tag=notify]", `§r§4[§6Paradox§4]§r Removed ${itemStackId.replace("minecraft:", "")} with lore from ${player.name}.`);
                    sendMsgToPlayer(player, `§r§4[§6Paradox§4]§r Item with illegal lores are not allowed!`);
                    rip(player, blockItemStack, null, block);
                    isFlagged = true;
                    break;
                }

                // Illegal Enchantments
                if (illegalEnchantmentBoolean) {
                    const enchantmentComponent = blockItemStack.getComponent("minecraft:enchantments") as ItemEnchantsComponent;
                    const enchantmentData = enchantmentComponent.enchantments;

                    // Update the enchantment presence and data maps for each enchantment type
                    const iterator = enchantmentData[Symbol.iterator]();
                    let iteratorResult = iterator.next();
                    while (!iteratorResult.done) {
                        const enchantment: Enchantment = iteratorResult.value;
                        enchantmentPresenceMap.set(enchantment, true);
                        enchantmentDataMap.set(enchantment, enchantmentData);
                        inventorySlotMap.set(enchantment, i);
                        itemStackDataMap.set(enchantment, blockItemStack);
                        iteratorResult = iterator.next();
                    }
                }

                // Salvage System
                if (salvageBoolean) {
                    const uniqueItems = ["minecraft:potion", "minecraft:splash_potion", "minecraft:lingering_potion", "minecraft:skull", "minecraft:planks", "minecraft:banner"];

                    if (!uniqueItems.includes(itemStackId)) {
                        const verifiedItemName = blockItemStack.nameTag;
                        if (!verifiedItemName) {
                            unverifiedItemMap.set(i, blockItemStack);
                        }
                    }
                }
            }
            if (isFlagged) {
                return;
            }
        }
    }

    // Iterate through the enchantment presence map to perform any necessary operations
    if (illegalEnchantmentBoolean) {
        let isPresent = false;
        for (const [enchantment, present] of enchantmentPresenceMap) {
            if (present) {
                // Do something with the present enchantment and its data
                const itemStackData = itemStackDataMap.get(enchantment);
                const enchantmentData = enchantmentDataMap.get(enchantment);
                const getEnchantment = enchantmentData.getEnchantment(enchantment.type);
                const currentLevel = getEnchantment.level;
                const maxLevel = getEnchantment.type.maxLevel;
                // Create new ItemStack to validate enchantments
                const newItemStack = new ItemStack(itemStackData.typeId);
                // Get the new enchantment component from the new ItemStack
                const newEnchantmentComponent = newItemStack.getComponent("minecraft:enchantments") as ItemEnchantsComponent;
                // Get the new enchantment data from the new ItemStack component
                const newEnchantmentData = newEnchantmentComponent.enchantments;
                // Verify if enchantment type is allowed on the item
                const canAddEnchantBoolean = newEnchantmentData.canAddEnchantment(getEnchantment);
                // Flag for illegal enchantments
                if (currentLevel > maxLevel || currentLevel < 0 || !canAddEnchantBoolean) {
                    const itemSlot = inventorySlotMap.get(enchantment);
                    const enchData = {
                        id: getEnchantment.type.id,
                        level: currentLevel,
                    };
                    const itemStackId = blockContainer.getItem(itemSlot);
                    blockContainer.setItem(itemSlot);
                    sendMsg("@a[tag=notify]", `§r§4[§6Paradox§4]§r Removed ${itemStackId.typeId.replace("minecraft:", "")} with Illegal Enchantments from ${player.name}.`);
                    sendMsgToPlayer(player, `§r§4[§6Paradox§4]§r Item with illegal Enchantments are not allowed!`);
                    enchantmentPresenceMap.clear();
                    enchantmentDataMap.clear();
                    inventorySlotMap.clear();
                    unverifiedItemMap.clear(); // Clear this map since we won't get that far to prevent memory leaks
                    itemStackDataMap.clear();
                    rip(player, itemStackId, enchData, block);
                    break;
                }
                isPresent = true;
            }
        }
        // Clear these populated maps if Salvage System is disabled to prevent memory leaks
        if (isPresent && !salvageBoolean) {
            enchantmentPresenceMap.clear();
            enchantmentDataMap.clear();
            inventorySlotMap.clear();
            itemStackDataMap.clear();
        }
    }

    // Salvage System
    if (salvageBoolean) {
        let salvagedList = false;
        // Iterate over the unverifiedItemMap
        for (const [slot, itemStackData] of unverifiedItemMap) {
            // Create a new name tag for the item
            const newNameTag = titleCase(itemStackData.typeId.replace("minecraft:", ""));
            // Create a new ItemStack with the same type as the original item
            const applyCustomProperties = new ItemStack(itemStackData.typeId);
            // Get the original enchantment component from the item
            const originalEnchantmentComponent = itemStackData.getComponent("minecraft:enchantments") as ItemEnchantsComponent;
            // Get the original enchantment data from the component
            const originalEnchantmentData = originalEnchantmentComponent.enchantments;
            // Get the new enchantment component from the new ItemStack
            const newEnchantmentComponent = applyCustomProperties.getComponent("minecraft:enchantments") as ItemEnchantsComponent;
            // Get the new enchantment data from the new ItemStack component
            const newEnchantmentData = newEnchantmentComponent.enchantments;

            // Iterate over the original enchantment data
            const iterator = originalEnchantmentData[Symbol.iterator]();
            let iteratorResult = iterator.next();
            while (!iteratorResult.done) {
                // Get the enchantment from the iterator
                const enchantment: Enchantment = iteratorResult.value;
                // Check if the enchantment is legal
                if (!illegalEnchantmentBoolean) {
                    // Get the enchantment from the original enchantment data
                    const getEnchantment = originalEnchantmentData.getEnchantment(enchantment.type);
                    // Check if the new ItemStack can have the enchantment added
                    const canAddEnchantBoolean = newEnchantmentData.canAddEnchantment(getEnchantment);
                    // If it can, add the enchantment to the new enchantment data
                    if (canAddEnchantBoolean) {
                        newEnchantmentData.addEnchantment(enchantment);
                        // Sets enchantment list to enchantment of new instance
                        newEnchantmentComponent.enchantments = newEnchantmentData;
                    }
                } else {
                    // Add the enchantment to the new enchantment data
                    newEnchantmentData.addEnchantment(enchantment);
                    // Sets enchantment list to enchantment of new instance
                    newEnchantmentComponent.enchantments = newEnchantmentData;
                }
                // Get the next item from the iterator
                iteratorResult = iterator.next();
                salvagedList = true;
            }

            // Set the name tag and lore of the new ItemStack
            applyCustomProperties.nameTag = newNameTag;
            applyCustomProperties.setLore(itemStackData.getLore());
            // Set the new ItemStack in the player's container in the specified slot
            blockContainer.setItem(slot, applyCustomProperties);
        }
        // Clear these populated maps to prevent memory leaks
        if (salvagedList) {
            unverifiedItemMap.clear();
            enchantmentPresenceMap.clear();
            enchantmentDataMap.clear();
            inventorySlotMap.clear();
            itemStackDataMap.clear();
        }
    }
}

const IllegalItemsB = () => {
    world.afterEvents.blockPlace.subscribe(illegalitemsb);
};

export { IllegalItemsB };