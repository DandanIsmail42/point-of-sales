const router = require("express").Router();
const multer = require("multer");
const os = require("os");
const authController = require("./controller");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

passport.use(
	new LocalStrategy({ usernameField: "email" }, authController.localStrategy)
);
router.post(
	"/register",
	multer({ dest: os.tmpdir() }).single("image"),
	authController.register
);
router.put(
	"/users/:userId",
	multer({ dest: os.tmpdir() }).single("image"),
	authController.updateUser
);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", authController.me);

module.exports = router;
