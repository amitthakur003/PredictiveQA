const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/PredictiveQA';
const client = new MongoClient(uri, {});

let dbInstance = null;

async function connect() {
    if (dbInstance) return dbInstance;
    await client.connect();
    // Use DB name in URI path if present, otherwise use last segment
    const dbName = client.s.options?.dbName || (uri.split('/').pop() || 'PredictiveQA');
    dbInstance = client.db(dbName);
    return dbInstance;
}

module.exports = { connect, client };