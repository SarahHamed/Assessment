const { Op } = require('sequelize');
const Product = require('../models/product');
const Family = require('../models/family');

async function searchCatalog(filters) {
    const { family_code, product_line, brand, status, sku, name } = filters;

    // Define default pagination values for clarity and easy maintenance.
    const DEFAULT_PAGE = 1;
    const DEFAULT_LIMIT = 10;
    const page = parseInt(filters.page, 10) || DEFAULT_PAGE;
    const limit = parseInt(filters.limit, 10) || DEFAULT_LIMIT;

    // Build Query Objects
    const productWhere = {};
    const familyWhere = {};

    // Exact Matches (Family)
    if (family_code) familyWhere.family_code = family_code;
    if (product_line) familyWhere.product_line = product_line;
    if (brand) familyWhere.brand = brand;
    if (status) familyWhere.status = status;

    // Partial Matches (Product) - Using Op.like
    if (sku) productWhere.sku = { [Op.like]: `%${sku}%` };
    if (name) productWhere.name = { [Op.like]: `%${name}%` };

    // Execute Query with Association
    const { count, rows } = await Product.findAndCountAll({
        where: productWhere,
        include: [{
            model: Family,
            where: familyWhere, // Applies filters to the joined table
            required: true      // Inner Join behavior (must match both)
        }],
        limit: limit,
        offset: (page - 1) * limit,
        subQuery: false // Important for correct counting with joins
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
        page: page,
        limit: limit,
        total_records: count,
        totalPages: totalPages,
        hasNextPage: hasNextPage,
        hasPreviousPage: hasPreviousPage,
        results: rows,
    };
}

module.exports = { searchCatalog };