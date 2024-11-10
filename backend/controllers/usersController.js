const bcrypt = require("bcryptjs");
const fs = require("fs");
const { User, validateUpdateUser } = require("../models/user");
const asyncHandler = require("express-async-handler");
const path = require("path");
const {
  cloudinaryUploadImage,
  cloudinaryRemoveImage,
  cloudinaryRemoveMultipleImage,
} = require("../utils/cloudinary");
const { Comment } = require("../models/comment");
const { Post } = require("../models/post");

module.exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").populate("posts");
  res.status(200).json(users);
});

module.exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate("posts");
  if (!user) {
    return res.status(404).json({ message: "user not found" });
  }
  res.status(200).json(user);
});

module.exports.updateUser = asyncHandler(async (req, res) => {
  const { error } = validateUpdateUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        username: req.body.username,
        password: req.body.password,
        bio: req.body.bio,
      },
    },
    { new: true }
  ).select("-password");
  res.status(200).json(updatedUser);
});

module.exports.getUsersCount = asyncHandler(async (req, res) => {
  const count = await User.countDocuments();
  res.status(200).json(count);
});

module.exports.profilePhotoUpload = asyncHandler(async (req, res) => {
  // validation
  if (!req.file) {
    return res.status(400).json({ message: "no file provided" });
  }
  // get the path of the image
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  // upload to cloudinary
  const result = await cloudinaryUploadImage(imagePath);
  // get the user from the db
  const user = await User.findById(req.user.id);
  // delete the old profile photo if exist
  if (user.profilePhoto.publicId !== null) {
    await cloudinaryRemoveImage(user.profilePhoto.publicId);
  }
  // change the profilePhoto field in the db
  user.profilePhoto = {
    url: result.secure_url,
    publicId: result.public_id,
  };
  await user.save();
  // send response to client
  res.status(200).json({
    message: "your profile photo uploaded successfully",
    profilePhoto: { url: result.secure_url, publicId: result.public_id },
  });
  // remove image from the server
  fs.unlinkSync(imagePath);
});

module.exports.deleteUser = asyncHandler(async (req, res) => {
  // get the user from db
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "user not found" });
  }
  // get all posts from db
  const posts = await Post.find({ user: user._id });
  // get the public ids from the posts
  const publicIds = posts?.map((post) => post.image.publicId);
  // delete all posts image from cloudinary that belong to this user
  if (publicIds?.length > 0) {
    await cloudinaryRemoveMultipleImage(publicIds);
  }
  // delete the profile picture from cloudinary
  await cloudinaryRemoveImage(user.profilePhoto.publicId);
  // delete user posts & comments
  await Post.deleteMany({ user: user._id });
  await Comment.deleteMany({ user: user._id });
  // delete the user
  await User.findByIdAndDelete(req.params.id);
  // send a response to the client
  res.status(200).json({ message: "your profile has been deleted" });
});
