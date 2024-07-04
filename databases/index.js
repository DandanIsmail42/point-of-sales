const mongoose = require("mongoose");
const { dbHost, dbPass, dbName, dbPort, dbUser } = require("../app/config");

const database =
	process.env.MONGO_URI ||
	`mongodb://${dbUser}:${dbPass}@${dbHost}:${dbPort},ac-4s1der3-shard-00-01.xj7jfyy.mongodb.net:${dbPort},ac-4s1der3-shard-00-02.xj7jfyy.mongodb.net:${dbPort}/${dbName}?ssl=true&replicaSet=atlas-y7r70h-shard-0&authSource=admin&retryWrites=true&w=majority`;

mongoose.connect(database, {
	useUnifiedTopology: true,
	useNewUrlParser: true,
	ssl: true,
	sslValidate: false,
});
const db = mongoose.connection;

// mongodb+srv://dandan:<password>@be.d2u423b.mongodb.net/?retryWrites=true&w=majority

module.exports = db;
