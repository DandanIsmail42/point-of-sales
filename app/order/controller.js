const CartItem = require("../cart-Item/model");
const DeliveryAddress = require("../deliveryAddress/model");
const Order = require("../order/model");
const { Types } = require("mongoose");
const OrderItem = require("../order-item/model");

const store = async (req, res, next) => {
	try {
		let { delivery_fee, delivery_address } = req.body;
		let items = await CartItem.find({ user: req.user._id }).populate(
			"product"
		);
		if (!items) {
			return res.json({
				error: 1,
				message: `You're not create order because you have not items in cart`,
			});
		}
		let address = await DeliveryAddress.findById(delivery_address);
		let order = await Order({
			_id: new Types.ObjectId(),
			status: "waiting_payment",
			delivery_fee: delivery_fee,
			delivery_address: {
				provinsi: address.provinsi,
				kabupaten: address.kabupaten,
				kecamatan: address.kecamatan,
				kelurahan: address.kelurahan,
				detail: address.detail,
			},
			user: req.user._id,
		});
		let orderItems = await OrderItem.insertMany(
			items.map((item) => ({
				...item,
				name: item.product.name,
				qty: parseInt(item.qty),
				price: parseInt(item.price),
				order: order._id,
				product: item.product._id,
			}))
		);
		orderItems.forEach((item) => order.order_items.push(item));
		order.save();
	} catch (err) {
		if (err && err.name == "ValidationError") {
			return res.json({
				message: err.message,
				fields: err.errors,
			});
		}
		next(err);
	}
};

// get
const index = async (req, res, next) => {
	try {
		let { skip = 0, limit = 10 } = req.query;
		let count = await Order.find({ user: req.user._id }).countDocuments();
		let orders = await Order.find({ user: req.user._id })
			.skip(parseInt(skip))
			.limit(parseInt(limit))
			.populate("order_items")
			.sort("-createdAt");
		return res.json({
			data: orders.map((order) => order.toJSON({ virtuals: true })),
			count,
		});
	} catch (err) {
		if (err && err.name == "ValidationError") {
			return res.json({
				message: err.message,
				fields: err.errors,
			});
		}
		next(err);
	}
};

module.exports = {
	store,
	index,
};
