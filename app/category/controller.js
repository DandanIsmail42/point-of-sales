const Categories = require("./model");

const store = async (req, res, next) => {
	try {
		let payload = req.body;
		let category = new Categories(payload);
		await category.save();
		return res.status(201).json({
			status: 201,
			category: category,
		});
	} catch (err) {
		if (err && err.name === "ValidatorError") {
			return res.json({
				error: 1,
				message: err.message,
				fields: err.errors,
			});
		}
		next(err);
	}
};

const update = async (req, res, next) => {
	try {
		let payload = req.body;
		let category = await Categories.findByIdAndUpdate(
			req.params.id,
			payload,
			{ new: true, runValidators: true }
		);
		return res.json(category);
	} catch (err) {
		if (err && err.name === "ValidatorError") {
			return res.json({
				error: 1,
				message: err.message,
				fields: err.errors,
			});
		}
		next(err);
	}
};

const index = async (req, res, next) => {
	try {
		let category = await Categories.find();
		return res.status(200).json({
			status: 200,
			record: category,
		});
	} catch (err) {
		if (err && err.name === "ValidatorError") {
			return res.json({
				error: 1,
				message: err.message,
				fields: err.errors,
			});
		}
		next(err);
	}
};

const destroy = async (req, res, next) => {
	try {
		let category = await Categories.findByIdAndDelete(req.params.id);
		return res.json(category);
	} catch (err) {
		if (err && err.name === "ValidatorError") {
			return res.json({
				error: 1,
				message: err.message,
				fields: err.errors,
			});
		}
		next(err);
	}
};

module.exports = {
	store,
	update,
	destroy,
	index,
};
