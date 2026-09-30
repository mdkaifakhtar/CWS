const fs = require('fs');
const path = require('path');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

/**
 * Uploads a single in-memory file buffer to Cloudinary if configured,
 * otherwise saves to local server/public/uploads directory and returns static URL.
 */
const saveLocally = (buffer, originalName, prefix = 'shop-image') => {
  return new Promise((resolve, reject) => {
    try {
      const uploadsDir = path.join(__dirname, '../../public/uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const ext = path.extname(originalName || '') || '.jpg';
      const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const filePath = path.join(uploadsDir, filename);

      fs.writeFile(filePath, buffer, (err) => {
        if (err) return reject(err);
        // Store a relative path, not an absolute host. Baking in a host here
        // (e.g. a hardcoded "http://localhost:5000") breaks for every client
        // whose own machine isn't that host, and breaks again the moment the
        // backend moves domains. The frontend resolves this relative path
        // against whichever API origin it's actually configured with — see
        // client/src/utils/resolveImageUrl.js.
        const fileUrl = `/uploads/${filename}`;
        resolve({
          secure_url: fileUrl,
          url: fileUrl,
          public_id: filename,
        });
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Uploads a single in-memory file buffer to Cloudinary if configured & working,
 * otherwise falls back to local server/public/uploads directory and returns static URL.
 */
const uploadBufferToCloudinary = async (buffer, { folder, resourceType = 'auto', originalName = 'upload.png', filePrefix = 'shop-image' } = {}) => {
  if (isCloudinaryConfigured) {
    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: resourceType },
          (error, res) => {
            if (error) return reject(error);
            resolve(res);
          }
        );
        stream.end(buffer);
      });
      if (result && (result.secure_url || result.url)) {
        return result;
      }
    } catch (cloudinaryErr) {
      console.warn(
        `[Cloudinary Warning] Cloudinary API upload error (${cloudinaryErr.message}). Verified credentials in .env do not match active Cloudinary account or have invalid signatures. Falling back to local disk storage (/public/uploads)...`
      );
    }
  }

  // Fallback: Save locally if Cloudinary is not configured or fails
  return saveLocally(buffer, originalName, filePrefix);
};

module.exports = { uploadBufferToCloudinary };

