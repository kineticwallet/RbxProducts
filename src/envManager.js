import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Get the directory of the current script (where the global rbxproducts is installed)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Point to the .env file in THAT directory
const envPath = path.join(__dirname, '.env');

export const EnvManager = {
    // Reads the file and returns a clean object of all keys
    getAll: () => {
        if (!fs.existsSync(envPath)) {
            console.log(`[DEBUG] ❌ File does not exist at that path.`);
            return {};
        }

        const content = fs.readFileSync(envPath, 'utf8');

        const lines = content.split('\n');

        const vars = {};
        lines.forEach((line, index) => {
            // Skip empty lines or comments
            if (!line.trim() || line.startsWith('#')) return;

            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const k = key.trim();
                const v = valueParts.join('=').trim();
                vars[k] = v;
            } else {
            }
        });

        return vars;
    },

    // Updates or Adds a key/value pair
    set: (key, value) => {
        let content = '';
        if (fs.existsSync(envPath)) {
            content = fs.readFileSync(envPath, 'utf8');
        }

        const lines = content.split('\n');
        const keyUpper = key.toUpperCase();
        let found = false;

        const updatedLines = lines.map(line => {
            if (line.trim().startsWith(`${keyUpper}=`)) {
                found = true;
                return `${keyUpper}=${value}`;
            }
            return line;
        });

        if (!found) {
            updatedLines.push(`${keyUpper}=${value}`);
        }

        // Clean up empty lines and write back
        fs.writeFileSync(envPath, updatedLines.filter(line => line.trim() !== '').join('\n') + '\n');
    }
};
