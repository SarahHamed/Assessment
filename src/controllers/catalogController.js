const importService = require('../services/importService');
const searchService = require('../services/searchService');
const logger = require('../utils/logger');

async function importData(req, res) {
    logger.info({ message: "Import process started" });

    // Check if at least one file was uploaded
    const familiesFile = req.files.familiesFile ? req.files.familiesFile[0] : null;
    const productsFile = req.files.productsFile ? req.files.productsFile[0] : null;

    if (!familiesFile && !productsFile) {
        return res.status(400).json({ error: "Please upload at least one file." });
    }

    try {
        const result = await importService.processImport(
            familiesFile ? familiesFile.path : null,
            productsFile ? productsFile.path : null
        );
        logger.info({ message: "Import finished", data: result });
        res.json({ message: "Import completed", ...result });
    } catch (err) {
        logger.error({ message: "Import Exception", error: err.message });
        res.status(500).json({ error: "Internal Server Error" });
    }
}

async function search(req, res) {
    try {
        const result = await searchService.searchCatalog(req.query);
        res.json(result);
    } catch (err) {
        logger.error({ message: "Search Error", error: err.message });
        res.status(500).json({ error: "Database error" });
    }
}

module.exports = { importData, search };