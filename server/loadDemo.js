// ...existing code...
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const demoPath = path.resolve(__dirname, '../client/demoData.json');
if (!fs.existsSync(demoPath)) {
    console.error('demoData.json not found at', demoPath);
    process.exit(1);
}

const dataRaw = fs.readFileSync(demoPath, 'utf8');
let payload;
try {
    payload = JSON.parse(dataRaw);
} catch (e) {
    console.error('demoData.json is not valid JSON:', e.message);
    process.exit(1);
}

const SERVER = process.env.SERVER_URL || 'http://localhost:4000';

(async () => {
    try {
        const resp = await axios.post(`${SERVER}/api/builds`, payload, { headers: { 'Content-Type': 'application/json' } });
        console.log('Upload result:', resp.data);
    } catch (err) {
        console.error('Upload failed:', err.response?.data || err.message || err);
    }
})();