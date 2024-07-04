const User = require("../user/model");
const path = require("path");
const fs = require("fs");
const config = require("../config");
const bcrypt = require("bcrypt");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const upload = require("../../utils/uploadImage.js"); // Mengimpor konfigurasi multer

const { getToken } = require("../../utils");

// const register = async (req, res, next) => {
// 	try {
// 		const payload = req.body;
// 		let user = new User(payload);
// 		if (user.password === req.body.confirm_password) {
// 			await user.save();
// 			return res.status(201).json({
// 				status: 201,
// 				message: "Register Succesfully",
// 				user: {
// 					full_name: user.full_name,
// 					email: user.email,
// 				},
// 			});
// 		} else {
// 			return res.status(422).json({
// 				error: 1,
// 				message: "password and confirm password do not match",
// 			});
// 		}
// 	} catch (err) {
// 		// cek kemungkinan kesalahan validasi
// 		if (err && err.name === "ValidationError") {
// 			return res.json({
// 				error: 1,
// 				message: err.message,
// 				fields: err.errors,
// 			});
// 		}
// 		// jika ada error lainnya
// 		next(err);
// 	}
// };

const register = async (req, res, next) => {
	try {
		if (req.file) {
			let tmp_path = req.file.path;
			let originalExt =
				req.file.originalname.split(".")[
					req.file.originalname.split(".").length - 1
				];
			let filename = req.file.filename + "." + originalExt;
			let target_path = path.resolve(
				config.rootPath,
				`public/images/users/${filename}`
			);

			const src = fs.createReadStream(tmp_path);
			const dest = fs.createWriteStream(target_path);
			src.pipe(dest);
			// Dapatkan data form yang tersedia
			src.on("end", async () => {
				const { full_name, email, password } = req.body;

				// Buat objek user dengan data form
				const user = new User({
					full_name,
					email,
					password,
					image_url: req.file ? filename : null, // Mendapatkan URL gambar jika diunggah
				});

				// Simpan user ke dalam database
				await user.save();

				// Kirim respons
				res.status(201).json({
					status: 201,
					message: "Register Succesfully",
					user: {
						full_name: user.full_name,
						email: user.email,
						image_url: user.image_url, // Menggunakan URL gambar dari user
					},
				});
			});
			src.on("error", async () => {
				next(err);
			});
		} else {
			try {
				const payload = req.body;
				let user = new User(payload);
				if (user.password === req.body.confirm_password) {
					await user.save();
					return res.status(201).json({
						status: 201,
						message: "Register Succesfully",
						user: {
							full_name: user.full_name,
							email: user.email,
							image_url: user.image_url ? user?.image_url : null,
						},
					});
				} else {
					return res.status(422).json({
						error: 1,
						message: "password and confirm password do not match",
					});
				}
			} catch (err) {
				// cek kemungkinan kesalahan validasi
				if (err && err.name === "ValidationError") {
					return res.json({
						error: 1,
						message: err.message,
						fields: err.errors,
					});
				}
				// jika ada error lainnya
				next(err);
			}
		}
	} catch (err) {
		// Tangani kesalahan
		if (err && err.name === "ValidationError") {
			return res.json({
				error: 1,
				message: err.message,
				fields: err.errors,
			});
		}
		next(err);
	}
};
const updateUser = async (req, res, next) => {
	try {
		const userId = req.user._id;
		const updates = req.body;
		const user = await User.findById(userId);

		// Check if both currentPassword and newPassword are provided
		if ("currentPassword" in updates && "newPassword" in updates) {
			const isPasswordValid = await bcrypt.compare(
				updates.currentPassword,
				user.password
			);
			if (!isPasswordValid) {
				return res.status(401).json({
					status: 401,
					error: 1,
					message: "Kata sandi salah",
				});
			}

			updates.password = bcrypt.hashSync(updates.newPassword, 10);
			delete updates.currentPassword;
			delete updates.newPassword;
		}

		if (req.file) {
			// Ambil data pengguna sebelum diperbarui untuk mendapatkan nama file gambar lama
			const userBeforeUpdate = await User.findById(userId);
			const oldImageFilename = userBeforeUpdate.image_url;

			// Lakukan pembaruan gambar
			let tmp_path = req.file.path;
			let originalExt =
				req.file.originalname.split(".")[
					req.file.originalname.split(".").length - 1
				];
			let filename = req.file.filename + "." + originalExt;
			let target_path = path.resolve(
				config.rootPath,
				`public/images/users/${filename}`
			);

			const src = fs.createReadStream(tmp_path);
			const dest = fs.createWriteStream(target_path);
			src.pipe(dest);

			src.on("end", async () => {
				// Hapus file gambar lama setelah pembaruan berhasil
				if (oldImageFilename) {
					const oldImagePath = path.resolve(
						config.rootPath,
						`public/images/users/${oldImageFilename}`
					);
					fs.unlinkSync(oldImagePath);
				}

				const updatedUser = await User.findByIdAndUpdate(
					userId,
					{
						...updates,
						image_url: filename,
					},
					{ new: true }
				);

				res.status(200).json({
					status: 200,
					message: "User updated successfully",
					user: {
						full_name: updatedUser.full_name,
						email: updatedUser.email,
						image_url: updatedUser.image_url,
					},
				});
			});
			src.on("error", async (err) => {
				next(err);
			});
		} else {
			const options = { new: true };
			const updatedUser = await User.findByIdAndUpdate(
				userId,
				updates,
				options
			).lean();

			res.status(200).json({
				status: 200,
				message: "User updated successfully",
				user: {
					full_name: updatedUser.full_name,
					email: updatedUser.email,
					image_url: updatedUser.image_url,
				},
			});
		}
	} catch (err) {
		if (err && err.name === "ValidationError") {
			return res.status(400).json({
				error: 1,
				message: err.message,
				fields: err.errors,
			});
		}
		next(err);
	}
};

const localStrategy = async (email, password, done) => {
	try {
		let user = await User.findOne({ email }).select(
			"-_v -createdAt -updatedAt -cart_items -token"
		);
		if (!user) return done();
		if (bcrypt.compareSync(password, user.password)) {
			({ password, ...userWithoutPassword } = user.toJSON());
			return done(null, userWithoutPassword);
		}
	} catch (err) {
		done(err, null);
	}
	done();
};

// const login = async (req, res, next) => {
// 	passport.authenticate("local", async function (err, user) {
// 		if (err) return next(err);
// 		if (!user)
// 			return res.status(404).json({
// 				status: 404,
// 				error: 1,
// 				message: "Email Tidak terdaftar",
// 			});
// 		let signed = jwt.sign(user, config.secretKey);

// 		await User.findByIdAndUpdate(user._id, { $push: { token: signed } });
// 		user.image_url = user.image_url ? user.image_url : null;
// 		console.log(user);
// 		res.status(200).json({
// 			status: 200,
// 			message: "Login Berhasil",
// 			user,
// 			token: signed,
// 		});
// 	})(req, res, next);
// };
const login = async (req, res, next) => {
	passport.authenticate("local", async function (err, user) {
		try {
			if (err) return next(err);
			if (!user) {
				return res.status(404).json({
					status: 404,
					error: 1,
					message: "Email atau Password salah",
				});
			}
			let signed = jwt.sign(user, config.secretKey, {
				expiresIn: "2d",
			});
			await User.findByIdAndUpdate(user._id, {
				$push: { token: signed },
			});
			user.image_url = user.image_url ? user.image_url : null;
			res.status(200).json({
				status: 200,
				message: "Login Berhasil",
				user,
				token: signed,
			});
		} catch (err) {
			next(err);
		}
	})(req, res, next);
};

const logout = async (req, res, next) => {
	let token = getToken(req);

	let user = await User.findOneAndUpdate(
		{ token: { $in: [token] } },
		{ $pull: { token: token } },
		{ useFindAndModify: false }
	);

	if (!token || !user) {
		res.json({
			error: 1,
			message: "No User Found",
		});
	}

	return res.status(200).json({
		status: 200,
		error: 0,
		message: "Logout Berhasil",
	});
};

const me = (req, res, next) => {
	if (!req.user) {
		res.status(422).json({
			err: 1,
			message: `You're not login or token expired`,
		});
	}
	console.log(req.user, "ini user");
	res.status(200).json({
		status: 200,
		record: req.user,
	});
};

module.exports = {
	register,
	localStrategy,
	login,
	logout,
	me,
	updateUser,
};
