import { world, DynamicPropertiesDefinition } from "mojang-minecraft";
import config from "../../data/config.js";

const World = world;

function registry(data) {
    let property = new DynamicPropertiesDefinition();

    // Define properties for World Border
    property.defineNumber('worldborder_n');
    property.defineBoolean('worldborder_b');

    // Define properties for xray
    property.defineBoolean('xraya_b')
    
    // Register Defined properties in world globally
    data.propertyRegistry.registerWorldDynamicProperties(property);

    // Set properties for world border
    let worldborder_n = World.getDynamicProperty('worldborder_n');
    if (worldborder_n === undefined) {
        World.setDynamicProperty('worldborder_n', config.modules.worldBorder.bordersize);
    }
    let worldborder_b = World.getDynamicProperty('worldborder_b');
    if (worldborder_b === undefined) {
        World.setDynamicProperty('worldborder_b', config.modules.worldBorder.enabled);
    }

    // Set properties for xray
    let xraya_b = World.getDynamicProperty('xraya_b');
    if (xraya_b === undefined) {
        World.setDynamicProperty('xraya_b', config.modules.xrayA.enabled);
    }
}

const Registry = () => {
    World.events.worldInitialize.subscribe(data => registry(data));
};

export { Registry };