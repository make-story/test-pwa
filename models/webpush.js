const mongoose = require('mongoose'); // MongoDB 기반 ODM(Object Data Modelling)

const { Schema } = mongoose;
const WebPushSchema = new Schema({
	//privateKey: String, // 비밀키
	//publicKey: String, // 공개키 
	subscription: Object, // 사용자 토큰 (이 토큰으로 사용자 구분) - subscription: {endpoint: '', expirationTime: null, keys: {p256dh: '', auth: ''}}
	endpoint: String, // subscription.endpoint - endpoint 값이 ,(콤마) 기준 여러개가 들어올 수 있다.
	use: Boolean, // 푸시 허용 여부

	userAgent: String, // 사용자 UA
});

module.exports = mongoose.model('WebPush', WebPushSchema); // webpushs