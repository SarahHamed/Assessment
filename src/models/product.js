const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // Direct import works now
const Family = require('./family');

const Product = sequelize.define('Product', {
    sku: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ean_upc: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    vehicle_type: {
        type: DataTypes.STRING,
        allowNull: true
    },
    family_code: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: Family,
            key: 'family_code'
        }
    }
}, {
    tableName: 'products',
    timestamps: false
});

// Define Relationships
// This links the two tables so "include: [Family]" works in your Search API
Family.hasMany(Product, { foreignKey: 'family_code' });
Product.belongsTo(Family, { foreignKey: 'family_code' });

module.exports = Product;