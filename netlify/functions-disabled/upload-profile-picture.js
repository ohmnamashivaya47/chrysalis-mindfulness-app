// Netlify Function: upload-profile-picture.js
// Uploads a profile picture to Cloudinary and returns a public URL
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { imageBase64 } = JSON.parse(event.body || '{}');
    if (!imageBase64) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No image data provided' }) };
    }
    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
      folder: 'profile-pictures',
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || undefined,
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ url: uploadResponse.secure_url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Upload failed', details: err.message }),
    };
  }
};
