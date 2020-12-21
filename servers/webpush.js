/*
-
Koa
https://koajs.com/#context
Express 가 오픈 소스의 소유권이 IBM 계열사인 StringLoop로 이전,
Koa 프레임워크는 Express 의 기존 개발 팀이 소유권을 IBM에 넘기기 전부터 개발해 오던 프로젝트로, 
Express 를 리팩토링한 결과물이며, 기존 Express 에 비해 아키텍처가 많이 바뀌어서 버전을 높이지 않고 새 이름을 붙였다고 합니다.
Koa 는 Express에 비해 훨씬 가볍고, Node v7.6 부터 정식으로 지원하는 async/await 문법을 아주 편하게 사용할 수 있습니다. 따라서 콜백을 무수하게 사용하는 콜백 지옥을 겪을 일도 없고, 비동기 작업도 편리하게 관리할 수 있습니다.

-
키를 다시 생성해야 하는 경우 - webpush.generateVAPIDKeys()
firebase 서버키(GCMAPIKey) 변경된 경우
publicKey 또는 privateKey 변경된 경우
*/
// require
const path = require('path'); 
const fs = require('fs'); 
const Koa = require('koa');
const Router = require('koa-router');
const koaCors = require('@koa/cors');
const koaBody = require('koa-body'); // HTTP 메소드 POST 같이 요청 정보를 Body에 포함하는 경우 (ctx.request.body)

const paths = require(path.resolve(__dirname, '../config/paths'));
const env = require(path.resolve(paths.appPath, 'config/env'));

//const mongodb = require(path.resolve(__dirname, '../databases/mongodb')); // 몽고DB
//const { models } = require(path.resolve(__dirname, '../databases/sequelize'));
//const mariadb = require(path.resolve(__dirname, '../databases/mariadb')); // MariaDB
//const mysql = require(path.resolve(__dirname, '../databases/mysql')); // MySQL
const webpush = require('web-push'); // 리모트 push 연결 https://www.npmjs.com/package/web-push

//const firebase = require('firebase');
const { exit } = require('process');

// Koa
const app = new Koa();
const router = new Router();

// middleware
app.use(koaCors());
app.use(koaBody());
app.use(router.routes());
app.use(router.allowedMethods());

// config
let webpushConfigPath = path.resolve(__dirname, '../.key/push.json');
let webpushConfig = {};
if(fs.existsSync(webpushConfigPath)) {
	//webpushConfig = require(webpushConfigPath);
	try {
		webpushConfig = JSON.parse(fs.readFileSync(webpushConfigPath).toString() || '{}'); 
	}catch(e) {}
}
if(!webpushConfig.GCMAPIKey) {
	console.log('Google Cloud Messaging API Key 에러!');
	process.exit();
}

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

// Web push
// web push 프로토콜에서 요구되는 암호키 (base64 인코딩 값)
// https://manu.ninja/web-push-notifications/
// https://firebase.google.com/docs/cloud-messaging/js/client?hl=ko
// https://developers.google.com/web/fundamentals/push-notifications/web-push-protocol
// 서버 공개키/비공개키 생성 도움 사이트: https://web-push-codelab.glitch.me/
// subscription : 사용자 페이지에서 공개키 + registration.pushManager.subscribe 함수를 통해 생성되는 각 클라이언트(구분) 정보
const getGenerateVAPIDKeys = function() { 
	// GCMAPIKey 가 변경되었을 경우, 다시 생성한다.
	// VAPID 키가 없거나 잘못되었을 경우, 다시 생성한다.
	// VAPID 키를 다시 생성할 경우, 클라이언트 (사용자가 보는 html 파일의 푸시 vapidPublicKey 값) publicKey 키도 변경해줘야한다.
	return webpush.generateVAPIDKeys();
};
let { GCMAPIKey=''/*Google Cloud Messaging API Key*/, publicKey=''/*공개키 : 클라이언트 (웹푸시를 사용하는 쪽 코드) 에서 사용*/, privateKey=''/*비밀키*/, } = webpushConfig;
if(!GCMAPIKey) {
	console.log('Google Cloud Messaging API Key 에러!');
	//process.exit();
}else if(!publicKey || !privateKey) {
	console.log('VAPIDKeys(publicKey/privateKey) 에러!');
	//process.exit();
}

// FCM 프로젝트에서의 클라우딩메시징 서버키 
// https://console.firebase.google.com/u/0/project/webpush-128d1/settings/cloudmessaging
try {
	webpush.setGCMAPIKey(GCMAPIKey);
	webpush.setVapidDetails('mailto:yu9221@gmail.com', publicKey, privateKey);
}catch(err) {
	// publicKey / privateKey 오류가 있을 경우 키 재생성 해야한다.
	console.log('FCM 에러!', err);
	// publicKey / privateKey 키 재생성
	//let vapidKeys = getGenerateVAPIDKeys(); 
	//publicKey = vapidKeys.publicKey;
	//privateKey = vapidKeys.privateKey;
	//console.log('VAPIDKeys 신규 생성', vapidKeys); // 보안 주의!
	//process.exit();
}

// 사용자 브라우저 푸시정보와 서버 푸시정보 일치여부 확인 
router.get('/push-check', (ctx, next) => {
	// ctx; // is the Context
	// ctx.request; // is a Koa Request
	// ctx.response; // is a Koa Response

	/*
	vapidKeys.publicKey
	vapidKeys.privateKey
	request.query.subscription
	*/
	
});

// 푸시 허용 (사용자 subscribe 정보 저장)
router.post('/push-subscribe', (ctx, next) => {
	// ctx; // is the Context
	// ctx.request; // is a Koa Request
	// ctx.response; // is a Koa Response

	// getter, setter 형태로 접근
	const { request, response, cookies, params, } = ctx;
	const { query, body, } = request;

	/*
	vapidKeys.publicKey
	vapidKeys.privateKey
	request.body.subscription
	subscription = JSON.parse(request.body.subscription); // 이 토큰을 DB에 저장하여 사용자에게 계속 푸시메시지를 보낼 수 있다.
	subscription 내부 존재하는 값 -> subscription: {endpoint: '', expirationTime: null, keys: {p256dh: '', auth: ''}} // 웹푸시 프로토콜 https://tools.ietf.org/html/draft-ietf-webpush-protocol
	webpush.sendNotification(JSON.parse(request.body.subscription), payload); // 푸시발송 
	*/

	// response.type = 'text/plain; charset=utf-8' | 'image/png'
	// response.body = string | Buffer | Stream | Object (json-stringified) | null
});

// 푸시 거부
router.post('/push-unsubscribe', (ctx, next) => {
	// ctx; // is the Context
	// ctx.request; // is a Koa Request
	// ctx.response; // is a Koa Response

	// getter, setter 형태로 접근
	const { request, response, cookies, params, } = ctx;
	const { query, body, } = request;

	/*
	vapidKeys.publicKey
	vapidKeys.privateKey
	request.body.subscription
	subscription = JSON.parse(request.body.subscription);
	subscription.endpoint
	*/

});

// 사용자가 푸시 확인했음
router.post('/push-confirm', (ctx, next) => {
	// ctx; // is the Context
	// ctx.request; // is a Koa Request
	// ctx.response; // is a Koa Response

	// getter, setter 형태로 접근
	const { request, response, cookies, params, } = ctx;
	const { query, body, } = request;

	/*
	request.body.subscription
	subscription = JSON.parse(request.body.subscription);
	*/
	
});

// 푸시 관리 페이지 접근 (발송/수정/삭제)
router.get('/push-admin', (ctx, next) => {
	// ctx; // is the Context
	// ctx.request; // is a Koa Request
	// ctx.response; // is a Koa Response

	// getter, setter 형태로 접근
	const { request, response, cookies, params, } = ctx;
	const { query, body, } = request;

	// return html
});

// 푸시 사용자 리스트 
router.get('/push-send', (ctx, next) => {
	// ctx; // is the Context
	// ctx.request; // is a Koa Request
	// ctx.response; // is a Koa Response

	// getter, setter 형태로 접근
	const { request, response, cookies, params, } = ctx;
	const { query, body, } = request;

	// return json
});

// 푸시 발송 
router.post('/push-send', (ctx, next) => {
	// ctx; // is the Context
	// ctx.request; // is a Koa Request
	// ctx.response; // is a Koa Response

	// getter, setter 형태로 접근
	const { request, response, cookies, params, } = ctx;
	const { query, body, } = request;

	/*
	vapidKeys.publicKey
	vapidKeys.privateKey

	let subscription = {
		endpoint: '< Push Subscription URL >',
		keys: {
			p256dh: '< User Public Encryption Key >',
			auth: '< User Auth Secret >'
		}
	};

	let payload = JSON.stringify({
		'title': title, // 푸시 제목
		'body': body, // 푸시 내용
		'icon': icon, // 푸시 알람에 표시될 앱 아이콘을 의미
		'badge': badge, // 배지는 모바일에서만 동작하는 속성입니다. 모바일에서 알람을 받을 때 상단 상태 바에 알람이 표시되는데, 어디서 알람이 알 수 있는 조그만아이콘을 의미
		'image': image, // 알람 창 안에 이미지를 표시하는 역할
		'vibrate': [200, 100, 200, 100, 300], // 알람이 표시될 때 진동 패턴을 정의 (무음모드가 아닐 경우)
		'sound': '/sound/alarm.mp3', // 알람이 표시될 때 나는 소리를 지정 - '/xx.mp3'
		'params': { // 사용자 정의 데이터 (사용자가 별도로 params 라는 값을 넣어서 보냄)
			'url': url
		} 
	});

	let options = {
		gcmAPIKey: '< GCM API Key >',
		vapidDetails: {
			subject: '< \'mailto\' Address or URL >',
			publicKey: '< URL Safe Base64 Encoded Public Key >',
			privateKey: '< URL Safe Base64 Encoded Private Key >'
		},
		TTL: <Number>,
		headers: {
			'< header name >': '< header value >'
		},
		contentEncoding: '< Encoding type, e.g.: aesgcm or aes128gcm >'
	};

	webpush.sendNotification(JSON.parse(subscription), payload, options)
	.then(function(data) {

	});
	*/
	
});

// 푸시 사용자 정보 수정
router.put('/push-send', (ctx, next) => {
	// ctx; // is the Context
	// ctx.request; // is a Koa Request
	// ctx.response; // is a Koa Response

	// getter, setter 형태로 접근
	const { request, response, cookies, params, } = ctx;
	const { query, body, } = request;

	/*
	vapidKeys.publicKey
	vapidKeys.privateKey
	*/
	
});

// 푸시 사용자 정보 제거 
router.delete('/push-send', (ctx, next) => {
	// ctx; // is the Context
	// ctx.request; // is a Koa Request
	// ctx.response; // is a Koa Response

	// getter, setter 형태로 접근
	const { request, response, cookies, params, } = ctx;
	const { query, body, } = request;

	/*
	vapidKeys.publicKey
	vapidKeys.privateKey
	*/

});

// 백그라운드 동기화 테스트 (네트워크가 불안정한 상태에서 다시 연결되었을 때, 서비스워커가 전송해주는 값)
/*router.get('/background-sync', (ctx, next) => {
	// ctx; // is the Context
	// ctx.request; // is a Koa Request
	// ctx.response; // is a Koa Response

	// getter, setter 형태로 접근
	const { request, response, cookies, params, } = ctx;
	const { query, body, } = request;

	
});*/

// test
//mariadb.test();

// server listen
const server = app.listen(env.pushPort, () => {
	console.log('WebPush Test Server', env.pushPort);
});