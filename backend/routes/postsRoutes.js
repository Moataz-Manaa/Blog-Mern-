const router = require("express").Router();
const photoUpload = require("../middlewares/photoUpload");
const { verifyToken } = require("../middlewares/verifyToken");
const {
  createPost,
  getAllPosts,
  getSinglePost,
  getPostCount,
  deletePost,
  updatePost,
  updatePostImage,
  toggleLike,
} = require("../controllers/postsController");
const validateObjectId = require("../middlewares/validateObjectId");

router
  .route("/")
  .post(verifyToken, photoUpload.single("image"), createPost)
  .get(getAllPosts);

router.route("/count").get(getPostCount);

router
  .route("/:id")
  .get(validateObjectId, getSinglePost)
  .delete(validateObjectId, verifyToken, deletePost)
  .put(validateObjectId, verifyToken, updatePost);

router
  .route("/update-image/:id")
  .put(
    validateObjectId,
    verifyToken,
    photoUpload.single("image"),
    updatePostImage
  );

router.route("/like/:id").put(validateObjectId, verifyToken, toggleLike);

module.exports = router;
