const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // Direct import works now

const Family = sequelize.define('Family', {
    family_code: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    family_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    product_line: {
        type: DataTypes.STRING,
        allowNull: false
    },
    brand: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
        allowNull: false
    }
}, {
    tableName: 'families',
    timestamps: false
});

module.exports = Family;