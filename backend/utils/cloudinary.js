const cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: "dbgvm4zkz",
  api_key: "497279654699337",
  api_secret: "yYvyz32GkS2oZ7otX7QvtBpq3LI",
});

const cloudinaryUploadImage = async (fileUpload) => {
  try {
    const data = await cloudinary.uploader.upload(fileUpload, {
      resource_type: "auto",
    });
    return data;
  } catch (error) {
    return error;
  }
};

const cloudinaryRemoveImage = async (imagePublicId) => {
  try {
    const result = await cloudinary.uploader.destroy(imagePublicId);
    return result;
  } catch (error) {
    return error;
  }
};

const cloudinaryRemoveMultipleImage = async (publicIds) => {
  try {
    const result = await cloudinary.v2.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    return error;
  }
};

module.exports = {
  cloudinaryUploadImage,
  cloudinaryRemoveImage,
  cloudinaryRemoveMultipleImage,
};
