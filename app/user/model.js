const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const AutoIncrement = require("mongoose-sequence")(mongoose);
const bcrypt = require("bcrypt");

let userSchema = Schema(
	{
		full_name: {
			type: String,
			required: [true, "Nama wajib diisi"],
			maxlength: [255, "Panjang nama harus amtara 3 - 255 karakter"],
			minlength: [3, "Panjang nama minimal harus 3 karakter"],
		},
		customer_id: {
			type: Number,
		},

		email: {
			type: String,
			required: [true, "Email wajib diisi"],
			maxlength: [255, "Panjang email maximal 255 karakter"],
		},

		password: {
			type: String,
			required: [true, "Password wajib diisi"],
			maxlength: [255, "Panjang password maximal 255 karakter"],
		},
		role: {
			type: String,
			enum: ["user", "admin"],
			default: "user",
		},
		image_url: String,
		token: [String],
	},
	{ timestamps: true }
);

// jika email sudah terdaftar
userSchema.path("email").validate(
	async function (value) {
		try {
			const count = await this.model("User").count({ email: value });

			return !count;
		} catch (err) {
			throw err;
		}
	},
	(attr) => `${attr.value} Sudah terdaftar`
);

const HASH_ROUND = 10;
userSchema.pre("save", function (next) {
	this.password = bcrypt.hashSync(this.password, HASH_ROUND);
	next();
});

userSchema.plugin(AutoIncrement, { inc_field: "customer_id" });

module.exports = model("User", userSchema);
