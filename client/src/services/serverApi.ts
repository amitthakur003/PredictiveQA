// ...existing code...
const SERVER = (import.meta.env.VITE_SERVER_URL as string) || 'http://localhost:4000';

export async function getRecentBuilds(limit = 5) {
    const res = await fetch(`${SERVER}/api/builds/recent?limit=${limit}`);
    if (!res.ok) throw new Error(`Error fetching recent builds: ${res.status}`);
    return res.json();
}

export async function uploadDemoFromClient() {
    // demoData.json is in client root and served by Vite at /demoData.json
    const demoResp = await fetch('/demoData.json');
    if (!demoResp.ok) throw new Error('Failed to load demoData.json from client');
    const demoJson = await demoResp.json();
    const res = await fetch(`${SERVER}/api/builds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoJson)
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
}