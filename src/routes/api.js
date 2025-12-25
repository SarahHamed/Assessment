const express = require('express');
const multer = require('multer');
const controller = require('../controllers/catalogController');

const router = express.Router();
const upload = multer({ dest: './uploads' });

// Define Routes
router.post('/import', 
    upload.fields([{ name: 'familiesFile' }, { name: 'productsFile' }]), 
    controller.importData
);

router.get('/search', controller.search);
// app.get('/api/products', ...);


module.exports = router;