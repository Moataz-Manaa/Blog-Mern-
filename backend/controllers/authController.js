const asyncHandler = require("express-async-handler");
const {
  User,
  validateRegisterUser,
  validateLoginUser,
} = require("../models/user");

module.exports.registerUser = asyncHandler(async (req, res) => {
  const { error } = validateRegisterUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  let user = await User.findOne({ email: req.body.email });
  if (user) {
    return res.status(400).json({ message: "user already exist" });
  }

  user = await User.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
  });
  res.status(201).json({ message: "you registred successfully" });
});

module.exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { error } = validateLoginUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const user = await User.findOne({ email });
  if (!user || !(await user.correctPassword(password, user.password))) {
    return res.status(400).json({ message: "invalid email or password" });
  }

  const token = user.generateAuthToken();

  res.status(200).json({
    _id: user._id,
    isAdmin: user.isAdmin,
    profilePhoto: user.profilePhoto,
    token,
  });
});
