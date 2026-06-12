const multer = require('multer');

const path = require('path');

// Configure multer to store file in memory as a buffer
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB limit
    },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (file.mimetype === 'application/pdf' || ext === '.pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

// Wrapper to handle multer errors gracefully and return 400 instead of 500
upload.handleSingle = (fieldName) => {
    const singleUpload = upload.single(fieldName);
    return (req, res, next) => {
        singleUpload(req, res, (err) => {
            if (err) {
                console.error('Multer single upload error:', err.message);
                return res.status(400).json({ message: err.message });
            }
            next();
        });
    };
};

upload.handleArray = (fieldName, maxCount) => {
    const arrayUpload = upload.array(fieldName, maxCount);
    return (req, res, next) => {
        arrayUpload(req, res, (err) => {
            if (err) {
                console.error('Multer array upload error:', err.message);
                return res.status(400).json({ message: err.message });
            }
            next();
        });
    };
};

module.exports = upload;
