const { getToken, policyFor } = require("../utils");
const jwt = require("jsonwebtoken");
const config = require("../app/config");
const User = require("../app/user/model");

// function decodeToken(){
//     return async function(req, res, next) {
//        try {
//         let token = getToken(req);
//         if(!token) return next();

//         req.user = jwt.verify(token, config.secretKey);

//         let user = await User.findOne({token: {$in: [token]}});
//         if(!user) {
//             res.json({
//                 error: 1,
//                 message: 'Token expired'
//             });
//         }
//        } catch (err) {
//         if(err && err.name === 'JsonWebTokenError') {
//            return res.json({
//                 error: 1,
//                 message: err.message
//             });
//         }
//         next(err);
//        }
//        return next();
//     }
// }

// function decodeToken() {
// 	return async function (req, res, next) {
// 		try {
// 			let token = getToken(req);
// 			if (!token) return next();

// 			const decodedToken = jwt.verify(token, config.secretKey);

// 			// Periksa apakah token sudah kedaluwarsa
// 			if (decodedToken.exp < Date.now() / 1000) {
// 				return res.status(401).json({
// 					error: 1,
// 					message: "Token expired",
// 				});
// 			}

// 			req.user = decodedToken;

// 			let user = await User.findOne({ token: { $in: [token] } });
// 			if (!user) {
// 				return res.status(401).json({
// 					status: 401,
// 					error: 1,
// 					message: "Invalid token",
// 				});
// 			}
// 		} catch (err) {
// 			if (err && err.name === "JsonWebTokenError") {
// 				return res.status(401).json({
// 					status: 401,
// 					error: 1,
// 					message: "Your login session has expired",
// 				});
// 			}
// 			next(err);
// 		}
// 		return next();
// 	};
// }

function decodeToken() {
	return async function (req, res, next) {
		try {
			let token = getToken(req);
			console.log("Token diterima:", token);
			if (!token) {
				console.log("Tidak ada token yang ditemukan dalam permintaan");
				return next();
			}

			// Verifikasi token
			jwt.verify(token, config.secretKey, async (err, decodedToken) => {
				if (err) {
					console.log("Error selama verifikasi token:", err);
					if (err.name === "TokenExpiredError") {
						return res.status(401).json({
							status: 401,
							error: 1,
							message: "Sesi login Anda telah kedaluwarsa",
						});
					} else if (err.name === "JsonWebTokenError") {
						return res.status(401).json({
							status: 401,
							error: 1,
							message: "Token tidak valid",
						});
					}
					return next(err);
				}

				console.log("Token yang sudah didekode:", decodedToken);
				req.user = decodedToken;

				// Periksa apakah token ada dalam model user
				let user = await User.findOne({ token: { $in: [token] } });
				if (!user) {
					return res.status(401).json({
						status: 401,
						error: 1,
						message: "Token tidak valid",
					});
				}

				next();
			});
		} catch (err) {
			next(err);
		}
	};
}
// middleware for check accsess
function policie_check(action, subject) {
	return function (req, res, next) {
		let policy = policyFor(req.user);
		if (!policy.can(action, subject)) {
			return res.json({
				error: 1,
				message: `You are not allowed to ${action} ${subject}`,
			});
		}
		next();
	};
}

module.exports = {
	decodeToken,
	policie_check,
};
