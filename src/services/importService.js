const fs = require('fs');
const Family = require('../models/family');
const Product = require('../models/product');
const { parseCSV, validateEAN, saveFailureReport } = require('../utils/helpers');

// --- Helper: Validate CSV Headers ---
// Checks if the file contains the required columns.
function validateHeaders(foundHeaders, requiredHeaders, filename) {
    if (!foundHeaders || foundHeaders.length === 0) {
         throw new Error(`File '${filename}' appears to be empty or unreadable.`);
    }
    const missing = requiredHeaders.filter(req => !foundHeaders.includes(req));
    
    if (missing.length > 0) {
        throw new Error(`File '${filename}' is missing required headers: ${missing.join(', ')}. Found: ${foundHeaders.join(', ')}`);
    }
}

async function processImport(familiesPath, productsPath) {
    const familyFailures = [];
    const productFailures = [];
    let familiesProcessed = 0;
    let productsProcessed = 0;

    // ==========================================
    // 1. PROCESS FAMILIES (If file provided)
    // ==========================================
    if (familiesPath) {
        try {
            const familiesData = await parseCSV(familiesPath);

            // Validation: Check Headers Immediately
            // We access .headers which we added to the helper in the previous step
            validateHeaders(
                familiesData.headers, 
                ['Family Code', 'Family Name', 'Product Line', 'Brand', 'Status'], 
                'families.csv'
            );

            for (let i = 0; i < familiesData.length; i++) {
                const row = familiesData[i];
                const rowNum = i + 2; // +1 for header, +1 for 0-index

                // Safe extraction with trimming
                const code = row['Family Code']?.trim();
                const name = row['Family Name']?.trim();
                const line = row['Product Line']?.trim();
                const brand = row['Brand']?.trim();
                const status = row['Status']?.trim();

                // Validation: Required Fields
                if (!code || !name || !line || !brand) {
                    familyFailures.push({ 
                        rowNumber: rowNum, 
                        key: code || 'UNKNOWN', 
                        reason: "Missing required fields (Code, Name, Line, or Brand)" 
                    });
                    continue;
                }

                try {
                    // UPSERT: Create if new, Update if exists
                    await Family.upsert({
                        family_code: code,
                        family_name: name,
                        product_line: line,
                        brand: brand,
                        status: status || 'ACTIVE'
                    });
                    familiesProcessed++;
                } catch (err) {
                    familyFailures.push({ rowNumber: rowNum, key: code, reason: err.message });
                }
            }
        } catch (err) {
            // Catches Header Errors or Parsing Errors
            familyFailures.push({ rowNumber: 1, key: 'FILE_ERROR', reason: err.message });
        } finally {
            // Clean up: Delete temp file
            if (fs.existsSync(familiesPath)) fs.unlinkSync(familiesPath);
        }
    }

    // ==========================================
    // 2. PROCESS PRODUCTS (If file provided)
    // ==========================================
    if (productsPath) {
        try {
            const productsData = await parseCSV(productsPath);

            // Validation: Check Headers Immediately
            validateHeaders(
                productsData.headers, 
                ['SKU', 'Name', 'Family Code'], 
                'products.csv'
            );

            // Optimization: Fetch all valid family codes once
            const existingFamilies = await Family.findAll({ attributes: ['family_code'] });
            const validFamilyCodes = new Set(existingFamilies.map(f => f.family_code));

            for (let i = 0; i < productsData.length; i++) {
                const row = productsData[i];
                const rowNum = i + 2;

                const sku = row['SKU']?.trim();
                const name = row['Name']?.trim();
                const famCode = row['Family Code']?.trim();
                const ean = row['EAN UPC']?.trim();
                const vehicle = row['Vehicle Type']?.trim();

                // Validation 1: Required Fields
                if (!sku || !name || !famCode) {
                    productFailures.push({ 
                        rowNumber: rowNum, 
                        key: sku || 'UNKNOWN', 
                        reason: "Missing required fields (SKU, Name, or Family Code)" 
                    });
                    continue;
                }

                // Validation 2: Referential Integrity
                if (!validFamilyCodes.has(famCode)) {
                    productFailures.push({ 
                        rowNumber: rowNum, 
                        key: sku, 
                        reason: `Family code '${famCode}' does not exist. Please upload families first.` 
                    });
                    continue;
                }

                // Validation 3: EAN Format (if provided)
                if (ean && !validateEAN(ean)) {
                    productFailures.push({ 
                        rowNumber: rowNum, 
                        key: sku, 
                        reason: "Invalid EAN format" 
                    });
                    continue;
                }

                try {
                    await Product.upsert({
                        sku: sku,
                        name: name,
                        family_code: famCode,
                        ean_upc: ean,
                        vehicle_type: vehicle
                    });
                    productsProcessed++;
                } catch (err) {
                    productFailures.push({ rowNumber: rowNum, key: sku, reason: err.message });
                }
            }
        } catch (err) {
            // Catches Header Errors or Parsing Errors
            productFailures.push({ rowNumber: 1, key: 'FILE_ERROR', reason: err.message });
        } finally {
            // Clean up: Delete temp file
            if (fs.existsSync(productsPath)) fs.unlinkSync(productsPath);
        }
    }

    // ==========================================
    // 3. GENERATE REPORTS & RETURN
    // ==========================================
    const famReport = saveFailureReport('families', familyFailures);
    const prodReport = saveFailureReport('products', productFailures);

    return {
        summary: {
            families: { processed: familiesProcessed, failed: familyFailures.length },
            products: { processed: productsProcessed, failed: productFailures.length }
        },
        reports: [famReport, prodReport].filter(Boolean)
    };
}

module.exports = { processImport };