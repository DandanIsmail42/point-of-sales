const multer = require("multer");

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "public/images/users"); // Ganti 'uploads/' dengan direktori tujuan penyimpanan file Anda
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname);
	},
});

const upload = multer({ storage: storage });

module.exports = upload;
