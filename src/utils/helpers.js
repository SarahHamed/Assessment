const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        let parsedHeaders = []; // Store headers here

        fs.createReadStream(filePath)
            .pipe(csv({ 
                separator: ';', 
                mapHeaders: ({ header }) => header.trim(),
                mapValues: ({ value }) => value.trim()
            }))
            .on('headers', (headers) => {
                parsedHeaders = headers; // Capture the header row immediately
            })
            .on('data', (data) => results.push(data))
            .on('end', () => {
                // Attach headers to the results array so we can check them later
                results.headers = parsedHeaders;
                resolve(results);
            })
            .on('error', (err) => reject(err));
    });
}

function validateEAN(ean) {
    if (!ean) return false;
    const s = String(ean).trim();
    return /^\d+$/.test(s) && s.length >= 8 && s.length <= 14;
}

function saveFailureReport(entity, failures) {
    if (failures.length === 0) return null;
    const dir = './failures';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    const filename = `${entity}_failures.csv`;
    const filePath = path.join(dir, filename);
    const header = "rowNumber;businessKey;reason\n";
    const rows = failures.map(f => `${f.rowNumber};${f.key};${f.reason}`).join('\n');
    
    fs.writeFileSync(filePath, header + rows);
    return filename;
}

module.exports = { parseCSV, validateEAN, saveFailureReport };