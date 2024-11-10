const fs = require("fs");
const {
  Post,
  validateCreatePost,
  validateUpdatePost,
} = require("../models/post");
const asyncHandler = require("express-async-handler");
const path = require("path");
const {
  cloudinaryUploadImage,
  cloudinaryRemoveImage,
} = require("../utils/cloudinary");
const { Comment } = require("../models/comment");

module.exports.createPost = asyncHandler(async (req, res) => {
  // validation for image
  if (!req.file) {
    return res.status(400).json({ message: "no image provided" });
  }

  // validation for data
  const { error } = validateCreatePost(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // upload photo
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);

  const result = await cloudinaryUploadImage(imagePath);

  // create new post and save it to db
  const post = new Post({
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    user: req.user.id,
    image: {
      url: result.secure_url,
      publicId: result.public_id,
    },
  });
  await post.save();

  // send response to client
  res.status(201).json(post);

  // remove image from the server
  fs.unlinkSync(imagePath);
});

module.exports.getAllPosts = asyncHandler(async (req, res) => {
  const POST_PER_PAGE = 3;
  const { pageNumber, category } = req.query;
  let posts;

  if (pageNumber) {
    posts = await Post.find()
      .skip((pageNumber - 1) * POST_PER_PAGE)
      .limit(POST_PER_PAGE)
      .sort({ createdAt: -1 })
      .populate("user", ["-password"]);
  } else if (category) {
    posts = await Post.find({ category })
      .sort({ createdAt: -1 })
      .populate("user", ["-password"]);
  } else {
    posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("user", ["-password"]);
  }
  res.status(200).json(posts);
});

module.exports.getSinglePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate("user", ["-password"])
    .populate("comments");
  if (!post) {
    return res.status(404).json({ message: "post not found" });
  }
  res.status(200).json(post);
});

module.exports.getPostCount = asyncHandler(async (req, res) => {
  const count = await Post.countDocuments();
  res.status(200).json(count);
});

module.exports.deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "post not found " });
  }

  if (req.user.isAdmin || req.user.id === post.user.toString()) {
    await Post.findByIdAndDelete(req.params.id);
    await cloudinaryRemoveImage(post.image.publicId);

    // delete all comments that belong to this post
    await Comment.deleteMany({ postId: post._id });

    res.status(200).json({
      message: "post has been deleted successfully",
      postId: post._id,
    });
  } else {
    res.status(403).json({ message: "access denied, forbidden" });
  }
});

module.exports.updatePost = asyncHandler(async (req, res) => {
  // validation
  const { error } = validateUpdatePost(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // get post from db and check if post exist
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "post not found" });
  }

  // check if this post belong to logged in user
  if (req.user.id !== post.user.toString()) {
    return res
      .status(403)
      .json({ message: "access denied, you are not allowed" });
  }

  // update post
  const updatedPost = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
      },
    },
    { new: true }
  ).populate("user", ["-password"]);

  // send response to the client
  res.status(200).json(updatedPost);
});

module.exports.updatePostImage = asyncHandler(async (req, res) => {
  // validation
  if (!req.file) {
    return res.status(400).json({ message: "no image provided" });
  }

  // get post from db and check if post exist
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "post not found" });
  }

  // check if this post belong to logged in user
  if (req.user.id !== post.user.toString()) {
    return res
      .status(403)
      .json({ message: "access denied, you are not allowed" });
  }

  // delete the old image
  await cloudinaryRemoveImage(post.image.publicId);

  // upload new photo
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  const result = await cloudinaryUploadImage(imagePath);

  // update the image field in the db
  const updatedPost = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        image: {
          url: result.secure_url,
          publicId: result.public_id,
        },
      },
    },
    { new: true }
  ).populate("user", ["-password"]);

  // send response to client
  res.status(200).json(updatedPost);

  // remove image from the server
  fs.unlinkSync(imagePath);
});

module.exports.toggleLike = asyncHandler(async (req, res) => {
  const loggedInUser = req.user.id;
  const { id: postId } = req.params;

  let post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ message: "post not found" });
  }

  const isPostAlreadyLiked = post.likes.find(
    (user) => user.toString() === loggedInUser
  );

  if (isPostAlreadyLiked) {
    post = await Post.findByIdAndUpdate(
      postId,
      { $pull: { likes: loggedInUser } },
      { new: true }
    );
  } else {
    post = await Post.findByIdAndUpdate(
      postId,
      { $push: { likes: loggedInUser } },
      { new: true }
    );
  }

  res.status(200).json(post);
});
