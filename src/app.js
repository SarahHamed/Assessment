const express = require('express');
const routes = require('./routes/api');
const { connectDB, sequelize } = require('./config/db');
require('./models/product'); // Import models to ensure associations trigger

const app = express();

app.use(express.static('public')); 


async function init() {
    await connectDB();
    // sync() creates table if they don't exist
    await sequelize.sync({ alter: false }); 
}

init();

app.use(express.json());
app.use('/api', routes);

module.exports = app;