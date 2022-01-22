/**
 * URL connection format
 * mongodb://[username:password@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]]
 * 
 * In below connection URL format
 * localhost:27017 = server:port, default port is 27017, port value is optional
 * test = our database name
 * 
 * See more: https://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html
 */
var dbUrl;

if (process.env.DATABASE_URL) {
	dbUrl = process.env.DATABASE_URL
} else if (process.env.DATABASE_NAME && process.env.DATABASE_USER && process.env.DATABASE_PASSWORD && process.env.DATABASE_HOST && process.env.DATABASE_PORT) {
	dbUrl = 'mongodb://' + process.env.DATABASE_USER + ':' + process.env.DATABASE_PASSWORD + '@' + process.env.DATABASE_HOST + ':' + process.env.DATABASE_PORT + '/' + process.env.DATABASE_NAME;
} else {
	dbUrl = 'mongodb+srv://root:wolf@cluster0.togbj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
	// dbUrl = 'mongodb+srv://csb:makemoney20012001@cluster0.rufvz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
}

var config = {
	database: {
		url: dbUrl
	},
	config: {
		MULTICALL: '0x5666349671AE8Fb980d3Cf4F03F805aF408Fb51a',
		MULTICALL_DIVISOR: 5,
	},
	server: {
		host: '127.0.0.1',
		port: '3000',
	},
	wolvesData: {
		Breed: [
			'Ground',
			'Water',
			'Ice',
			'Fire',
			'Forest',
			'Air',
			'Electric',
			'Legendary',
		],
		Gender: ['Male', 'Female'],
		Level: ['Wood', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
	},
	materialsData: {
		Level: ['Wood', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
	},
	rpcprovider: 'https://speedy-nodes-nyc.moralis.io/63842bcca9982a74b2a9fd41/bsc/testnet'
};

module.exports = config;
