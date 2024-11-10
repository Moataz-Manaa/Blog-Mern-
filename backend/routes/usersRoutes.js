const router = require("express").Router();
const {
  getAllUsers,
  getUser,
  updateUser,
  getUsersCount,
  profilePhotoUpload,
  deleteUser,
} = require("../controllers/usersController");
const {
  verifyTokenAndAdmin,
  verifyTokenAndOnlyUser,
  verifyToken,
  verifyTokenAndAuthorization,
} = require("../middlewares/verifyToken");
const validateObjectId = require("../middlewares/validateObjectId");
const photoUpload = require("../middlewares/photoUpload");

router.route("/").get(verifyTokenAndAdmin, getAllUsers);
router.route("/count").get(verifyTokenAndAdmin, getUsersCount);
router
  .route("/profile-photo-upload")
  .post(verifyToken, photoUpload.single("image"), profilePhotoUpload);
router
  .route("/:id")
  .get(validateObjectId, getUser)
  .put(validateObjectId, verifyTokenAndOnlyUser, updateUser)
  .delete(validateObjectId, verifyTokenAndAuthorization, deleteUser);

module.exports = router;
