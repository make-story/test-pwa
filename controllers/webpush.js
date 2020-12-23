const path = require('path'); 
const fs = require('fs');

// DB
//const mongodb = require(path.resolve(__dirname, '../databases/mongodb')); // 몽고DB
//const WebpushModel = require(path.resolve(__dirname, '../models/webpush'));
//const { models } = require(path.resolve(__dirname, '../databases/sequelize')); // sequelize
//const mariadb = require(path.resolve(__dirname, '../databases/mariadb')); // MariaDB

// webpush
//const firebase = require('firebase');

/*
// mongodb
// https://mongoosejs.com/docs/api/query.html
const findQuery = { _title: '', };
const findProjection = { _id: 0, requests: 0, };
const limit = 60;
const result = await WebpushModel.find(findQuery, findProjection).sort({ _date: -1, _time: -1 }).limit(limit).exec();

// mariadb
let connection = null;
let result = {};
try {
	connection = await mariadb.pool.getConnection();
	result = await connection.query("select * from test");
}catch(error) {
	throw error;
}finally {
	connection && connection.release(); // release to pool
}

result = await connection.query("INSERT INTO myTable value (?, ?)", [1, "mariadb"]);
// result: { affectedRows: 1, insertId: 1, warningStatus: 0 }
*/

// sequelize test
/*router.get('/list', async (ctx) => {
	// https://sequelize.org/master/manual/model-querying-basics.html
 	const results = await models.boards.findAll().map(({ id, name, content, created_at}) => {
		return { id, name, content, created_at };
	});
 
	ctx.body = {
		results
	};
});*/

// subscription 유효성
const isSubscription = subscription => {
	if(subscription && typeof subscription === 'string') {
		try {
			subscription = JSON.parse(subscription);
		}catch (e) {
			subscription = '';
		}
	}
	if(typeof subscription === 'object' && !Array.isArray(subscription) && Object.keys(subscription).length) {
		return true;
	}else {
		return false;
	}
};

exports.test = (ctx, next) => {
	response.end('TEST');
};
exports.check = (ctx, next) => {
	
}; 
exports.subscribe = (ctx, next) => {
	
};
exports.unsubscribe = (ctx, next) => {
	
};