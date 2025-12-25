const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
const logger = require('../utils/logger');
require('dotenv').config();

// 1. Initialize Sequelize IMMEDIATELY (so Models can use it)
// We are just storing config here, not connecting yet.
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT || 'mysql',
        logging: false,
    }
);

async function connectDB() {
    try {
        // 2. Pre-flight: Create DB if missing
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });
        
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
        await connection.end();

        // 3. Now verify the Sequelize connection
        await sequelize.authenticate();
        logger.info({ message: `MySQL Connected to '${process.env.DB_NAME}'` });

    } catch (error) {
        logger.error({ message: "Database Init Failed", error: error.message });
        process.exit(1);
    }
}

module.exports = { sequelize, connectDB };