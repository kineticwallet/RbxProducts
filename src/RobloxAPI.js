
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

// Define API_KEY and UNIVERSE_ID as variables that will be set by the caller.
let API_KEY;
let UNIVERSE_ID;

// Define an initialization function
function init(config) {
    API_KEY = config.API_KEY;
    UNIVERSE_ID = config.UNIVERSE_ID;

    // Utility to throw clear configuration errors
    if (!API_KEY || !UNIVERSE_ID) {
        throw new Error(
            "Configuration Error: ROBLOX_API_KEY and UNIVERSE_ID must be set in the .env file at the project root."
        );
    }
}

const API_BASE_URL = () => `https://apis.roblox.com/game-passes/v1/universes/${UNIVERSE_ID}/game-passes`;

// --- Interface for Game Pass Data ---
/**
 * @typedef {Object} GamePassCreationData
 * @property {string} name 
 * @property {string} description 
 * @property {string} iconPath // Local file path
 * @property {number} price 
 * @property {boolean} [isForSale]
 */

/**
 * @typedef {Object} GamePassUpdateData
 * @property {number} id
 * @property {string} [iconPath] // Local file path
 * @property {string} [name]
 * @property {string} [description]
 * @property {number} [price]
 * @property {boolean} [isForSale]
 */

/**
 * @typedef {Object} PriceInformation
 * @property {number} defaultPriceInRobux
 */

/**
 * @typedef {Object} GamepassEntry // entry inside table returned
 * @property {number} gamePassId
 * @property {number} productId
 * @property {string} name
 * @property {string} description
 * @property {universeId} number
 * @property {boolean} isForSale
 * @property {number} iconAssetId
 * @property {PriceInformation} priceInformation
 */

/**
 * @typedef {Object} DevProductEntry // entry inside table returned
 * @property {number} productId
 * @property {string} name
 * @property {string} description
 * @property {universeId} number
 * @property {boolean} isForSale
 * @property {number} iconAssetId
 * @property {PriceInformation} priceInformation
 */


/**
 * @typedef {Object} DevProductCreationData
 * @property {string} name 
 * @property {string} description
 * @property {string} iconPath // Local file path
 * @property {boolean} isForSale
 * @property {number} price 
 */


/**
 * @typedef {Object} DevProductUpdateData
 * @property {number} id
 * @property {string} [iconPath] // Local file path
 * @property {string} [name]
 * @property {string} [description]
 * @property {number} [price]
 */

// --- Public API Methods ---

/**
 * Creates a new Game Pass using the file content.
 * @param {GamePassCreationData} data 
 * @returns {Promise<number>} New Game Pass ID.
 */
async function createGamePass(data) {
    if (!fs.existsSync(data.iconPath)) {
        throw new Error(`Icon file not found at path: ${data.iconPath}`);
    }

    const form = new FormData();
    form.append('name', data.name);
    form.append('description', data.description);
    form.append('isForSale', String(data.isForSale));
    form.append('price', String(data.price));

    // Append the image file content
    form.append('imageFile', fs.createReadStream(data.iconPath), {
        filename: path.basename(data.iconPath),
        contentType: 'image/png' // Assuming PNG
    });

    try {
        const response = await axios.post(API_BASE_URL(), form, {
            headers: {
                'x-api-key': API_KEY,
                ...form.getHeaders()
            }
        });
        return response.data.gamePassId;
    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
        throw new Error(`Failed to create Game Pass "${data.name}".`);
    }
}

/**
 * Creates a new Game Pass using the file content.
 * @param {DevProductCreationData} data 
 * @returns {Promise<number>} New Game Pass ID.
 */
async function createDevProduct(data) {
    if (!fs.existsSync(data.iconPath)) {
        throw new Error(`Icon file not found at path: ${data.iconPath}`);
    }

    console.log("\n--- CREATING DEV PRODUCT ---");

    const form = new FormData();
    form.append('name', data.name);
    form.append('description', data.description);
    form.append('isForSale', String(data.isForSale));
    form.append('price', String(data.price));

    // Append the image file content
    form.append('imageFile', fs.createReadStream(data.iconPath), {
        filename: path.basename(data.iconPath),
        contentType: 'image/png' // Assuming PNG
    });

    try {
        const response = await axios.post(`https://apis.roblox.com/developer-products/v2/universes/${UNIVERSE_ID}/developer-products`, form, {
            headers: {
                'x-api-key': API_KEY,
                ...form.getHeaders()
            }
        });
        return response.data.productId;
    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
        throw new Error(`Failed to create Dev Product "${data.name}".`)
    }
}

/**
 * Retrieves a list of all Game Passes for the configured universe.
 * @returns {Promise<Array<GamepassEntry>>} List of Game Pass objects.
 */
async function listGamePasses() {
    // FIX 1: Use the correct endpoint with the '/creator' suffix.
    const LIST_API_URL = `${API_BASE_URL()}/creator`;

    try {
        const response = await axios.get(LIST_API_URL, {
            headers: { 'x-api-key': API_KEY }
        });

        // FIX 2: The list API returns the array inside the 'gamePasses' property.
        return response.data.gamePasses;

    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
        throw new Error("Failed to retrieve Game Pass list. Check API Key scope (gamepass:read) and the Universe ID.");
    }
}

/**
 * Retrieves a list of all Game Passes for the configured universe.
 * @returns {Promise<Array<DevProductEntry>>} List of Game Pass objects.
 */
async function listDevProducts() {
    const LIST_API_URL = `https://apis.roblox.com/developer-products/v2/universes/${UNIVERSE_ID}/developer-products/creator`;

    try {
        const response = await axios.get(LIST_API_URL, {
            headers: { 'x-api-key': API_KEY }
        });

        // FIX 2: The list API returns the array inside the 'gamePasses' property.
        return response.data.developerProducts;

    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
        throw new Error("Failed to retrieve Game Pass list. Check API Key scope (gamepass:read) and the Universe ID.");
    }
}

/**
 * Updates a specific Game Pass with new details.
 * @param {GamePassUpdateData} data - The update payload (must include 'id').
 * @returns {Promise<void>}
 */
async function updateGamepass(data) {
    const { id, iconPath, name, desc, price } = data;
    const form = new FormData();

    // 1. TEXT FIELDS FIRST
    // The order can actually matter for some multi-part parsers
    if (name) form.append('name', name);
    if (desc) form.append('description', desc);

    if (price !== undefined) {
        form.append('price', String(price));
        form.append('isForSale', 'true'); // Usually required if setting price
    }

    // 2. THE FILE (binary)
    if (iconPath && fs.existsSync(iconPath)) {
        // We MUST provide a filename and content-type for the $binary spec
        form.append('file', fs.createReadStream(iconPath), {
            filename: 'icon.png',
            contentType: 'image/png',
        });
    }

    try {
        await axios.patch(
            `https://apis.roblox.com/game-passes/v1/universes/${UNIVERSE_ID}/game-passes/${id}`,
            form,
            {
                headers: {
                    'x-api-key': process.env.ROBLOX_API_KEY,
                    ...form.getHeaders() // This adds the 'boundary' string
                }
            }
        );

        console.log(`✅ Gamepass ${id} updated!`);
    } catch (error) {
        // Log the full error to see if Roblox is giving a "field" hint
        if (error.response?.data) {
            console.error('❌ API Details:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ API Error:', error.message);
        }
        throw error;
    }
}

/**
 * Updates a specific Game Pass with new details.
 * @param {DevProductUpdateData} data - The update payload (must include 'id').
 * @returns {Promise<void>}
 */
async function updateDevProduct(data) {
    const { id, iconPath, name, desc, price } = data;
    const form = new FormData();

    // 1. TEXT FIELDS (Matches DevProduct Spec)
    if (name) form.append('name', name);
    if (desc) form.append('description', desc);

    if (price !== undefined) {
        form.append('price', String(price));
        form.append('isForSale', 'true');
    }

    // 2. THE IMAGE (Note the key change: "imageFile")
    if (iconPath && fs.existsSync(iconPath)) {
        form.append('imageFile', fs.createReadStream(iconPath), {
            filename: 'product_icon.png',
            contentType: 'image/png',
        });
    }

    try {

        await axios.patch(
            `https://apis.roblox.com/developer-products/v2/universes/${UNIVERSE_ID}/developer-products/${id}`,
            form,
            {
                headers: {
                    'x-api-key': process.env.ROBLOX_API_KEY,
                    ...form.getHeaders()
                }
            }
        );

        console.log(`✅ Dev Product ${id} updated!`);
    } catch (error) {
        if (error.response?.data) {
            console.error('❌ DevProduct API Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ Error:', error.message);
        }
        throw error;
    }
}

/**
 * Fetches the name of the Universe (Experience) using the V2 Cloud API.
 * FIX: Updated URL and response key based on new documentation.
 * @returns {Promise<string>} The display name of the universe.
 */
async function getUniverseName() {
    // FIX 1: Use the new V2 Cloud API endpoint URL
    const UNIVERSE_INFO_URL = `https://apis.roblox.com/cloud/v2/universes/${UNIVERSE_ID}`;

    try {
        const response = await axios.get(UNIVERSE_INFO_URL, {
            headers: { 'x-api-key': API_KEY }
        });

        // FIX 2: The response contains the name in the 'displayName' field
        return response.data.displayName;

    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
        console.error('Warning: Could not fetch Universe Name. Check API Key scope (universe:read) and ensure the ID is correct.');
        return `[Unknown Game Name]`;
    }
}

export default {
    init: init,
    createGamePass: createGamePass,
    createDevProduct: createDevProduct,
    listGamePasses: listGamePasses,
    listDevProducts: listDevProducts,
    updateGamepass: updateGamepass,
    updateDevProduct: updateDevProduct,
    getUniverseName: getUniverseName, // <-- New export
};
