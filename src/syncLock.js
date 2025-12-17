import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const lockPath = path.join(__dirname, 'sync-lock.json');

export const SyncLock = {
    get: () => {
        if (!fs.existsSync(lockPath)) return {};
        return JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    },
    set: (assetId, hash) => {
        const lock = SyncLock.get();
        lock[assetId] = hash;
        fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2));
    }
};