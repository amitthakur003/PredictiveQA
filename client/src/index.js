const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const buildsRoute = require('../../server/routes/builds');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/builds', buildsRoute);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});