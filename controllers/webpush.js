const path = require('path'); 

const WebPush = require(path.resolve(__dirname, '../models/webpush'));
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

exports.list = (ctx) => {
	ctx.body = 'listed';

	/*const { params, query } = request;
	const { title='test' } = params;
	const findQuery = { _title: title };
	const findProjection = { _id: 0, requests: 0 };
	// return Request.find(query, projection).sort(sort).exec();
	const result = await Request.find(findQuery, findProjection).sort({ _date: -1 }).exec();
	response.json(result);*/
};

exports.create = (ctx) => {
	ctx.body = 'created';
};

exports.delete = (ctx) => {
	ctx.body = 'deleted';
};

exports.replace = (ctx) => {
	ctx.body = 'replaced';
};

exports.update = (ctx) => {
	ctx.body = 'updated';
};