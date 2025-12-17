// config.js

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ESM doesn't have __dirname, so recreate it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV_PATH = path.resolve(__dirname, '.env');

dotenv.config({ path: ENV_PATH });

// ESM export
export default {
    API_KEY: process.env.ROBLOX_API_KEY,
    UNIVERSE_ID: process.env.UNIVERSE_ID,
    CREATOR_USER_ID: process.env.CREATOR_USER_ID
};