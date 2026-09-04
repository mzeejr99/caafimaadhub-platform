const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const upload = require('../middleware/upload');
const { optionalAuth } = require('../middleware/auth');

router.post('/', optionalAuth, upload.single('file'), (req, res, next) => uploadController.handleFileUpload(req, res, next));

module.exports = router;
