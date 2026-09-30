const cloudinary = require('cloudinary').v2;

const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim().replace(/^["']|["']$/g, '');
const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim().replace(/^["']|["']$/g, '');
const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim().replace(/^["']|["']$/g, '');

const isConfigured = !!(cloudName && apiKey && apiSecret);

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

module.exports = { cloudinary, isCloudinaryConfigured: isConfigured };
