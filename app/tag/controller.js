const Tag = require("./model");

const store = async (req, res, next) => {
	try {
		let payload = req.body;
		let tag = new Tag(payload);
		await tag.save();
		return res.status(201).json({
			status: 201,
			tag: tag,
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
		let tag = await Tag.findByIdAndUpdate(req.params.id, payload, {
			new: true,
			runValidators: true,
		});
		return res.json(tag);
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
		let tag = await Tag.find();
		return res.status(200).json({
			status: 200,
			record: tag,
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
		let tag = await Tag.findByIdAndDelete(req.params.id);
		return res.json(tag);
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
