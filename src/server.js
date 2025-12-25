// Load env vars at the very top
require('dotenv').config();

const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    logger.info({ message: `Server running on http://localhost:${PORT}` });
});