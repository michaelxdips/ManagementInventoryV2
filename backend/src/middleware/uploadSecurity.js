import rateLimit from 'express-rate-limit';

/**
 * Security middleware for Excel file uploads
 * Mitigates xlsx prototype pollution and ReDoS vulnerabilities
 */

// Rate limiter specifically for bulk import endpoints
export const bulkImportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // 1 request per minute per IP
  message: {
    message: 'Terlalu banyak bulk import. Tunggu 1 menit sebelum mencoba lagi.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Validate and sanitize Excel upload
 */
export const validateExcelUpload = (req, res, next) => {
  // 1. Check if file exists
  if (!req.file && !req.body.items) {
    return res.status(400).json({ message: 'File Excel atau data tidak ditemukan' });
  }

  // 2. File size limit (5MB max)
  if (req.file && req.file.size > 5 * 1024 * 1024) {
    return res.status(413).json({
      message: 'File terlalu besar. Maksimal 5MB.',
    });
  }

  // 3. Validate MIME type if file upload
  if (req.file) {
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        message: 'Format file tidak valid. Hanya .xlsx dan .xls yang diizinkan.',
      });
    }
  }

  // 4. Validate items array if direct JSON upload
  if (req.body.items) {
    if (!Array.isArray(req.body.items)) {
      return res.status(400).json({ message: 'Format data tidak valid' });
    }

    // Limit number of items (prevent DoS)
    if (req.body.items.length > 5000) {
      return res.status(413).json({
        message: 'Terlalu banyak data. Maksimal 5000 baris per upload.',
      });
    }
  }

  // 5. Set request timeout (30 seconds)
  req.setTimeout(30000, () => {
    res.status(408).json({
      message: 'Request timeout. File terlalu kompleks atau koneksi lambat.',
    });
  });

  next();
};

/**
 * Freeze Object.prototype to prevent prototype pollution
 * Call this once at application startup
 */
export const freezePrototype = () => {
  // Freeze Object.prototype to prevent pollution attacks
  Object.freeze(Object.prototype);
  Object.freeze(Array.prototype);
  
  console.log('🔒 Object prototypes frozen (xlsx vulnerability mitigation)');
};

/**
 * Sanitize parsed Excel data to remove potential prototype pollution
 */
export const sanitizeExcelData = (items) => {
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    // Create a clean object without prototype chain
    const clean = Object.create(null);

    // Only copy safe properties
    const allowedKeys = [
      'nama_barang',
      'kode_barang',
      'qty',
      'satuan',
      'lokasi_simpan',
      'min_stock',
    ];

    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(item, key)) {
        const value = item[key];

        // Sanitize value based on type
        if (typeof value === 'string') {
          clean[key] = String(value).trim().substring(0, 255); // Limit string length
        } else if (typeof value === 'number') {
          clean[key] = Number.isFinite(value) ? value : 0;
        } else {
          clean[key] = value;
        }
      }
    }

    return clean;
  });
};

/**
 * Middleware to sanitize request body items
 */
export const sanitizeExcelMiddleware = (req, res, next) => {
  if (req.body.items && Array.isArray(req.body.items)) {
    req.body.items = sanitizeExcelData(req.body.items);
  }
  next();
};
