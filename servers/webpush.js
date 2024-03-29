/*
-
Koa
https://koajs.com/#context
Express 가 오픈 소스의 소유권이 IBM 계열사인 StringLoop로 이전,
Koa 프레임워크는 Express 의 기존 개발 팀이 소유권을 IBM에 넘기기 전부터 개발해 오던 프로젝트로, 
Express 를 리팩토링한 결과물이며, 기존 Express 에 비해 아키텍처가 많이 바뀌어서 버전을 높이지 않고 새 이름을 붙였다고 합니다.
Koa 는 Express에 비해 훨씬 가볍고, Node v7.6 부터 정식으로 지원하는 async/await 문법을 아주 편하게 사용할 수 있습니다. 따라서 콜백을 무수하게 사용하는 콜백 지옥을 겪을 일도 없고, 비동기 작업도 편리하게 관리할 수 있습니다.


-
GCM (Goggle Cloud Messaging)
FCM (Firebase Cloud Messaging)프로젝트에서의 클라우딩메시징 서버키 필요 


-
키를 다시 생성해야 하는 경우 - webpush.generateVAPIDKeys()
firebase 서버키(GCMAPIKey) 변경된 경우
publicKey 또는 privateKey 변경된 경우

const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();
console.log(vapidKeys.publicKey);
console.log(vapidKeys.privateKey);
process.exit();


-
참고 자료
https://manu.ninja/web-push-notifications/
https://firebase.google.com/docs/cloud-messaging/js/client?hl=ko
https://developers.google.com/web/fundamentals/push-notifications/web-push-protocol
*/
// require
const path = require('path'); 
const fs = require('fs'); 
const Koa = require('koa');
const Router = require('koa-router');
const koaCors = require('@koa/cors');
const koaBody = require('koa-body'); // HTTP 메소드 POST 같이 요청 정보를 Body에 포함하는 경우 (ctx.request.body)
const webpush = require('web-push'); // 리모트 push 연결 https://www.npmjs.com/package/web-push
//const firebase = require('firebase');
const { exit } = require('process');

const paths = require(path.resolve(__dirname, '../config/paths'));
const env = require(path.resolve(paths.appPath, 'config/env'));

//const mongodb = require(path.resolve(__dirname, '../databases/mongodb')); // 몽고DB
//const { models } = require(path.resolve(__dirname, '../databases/sequelize'));
//const mariadb = require(path.resolve(__dirname, '../databases/mariadb')); // MariaDB
//const mysql = require(path.resolve(__dirname, '../databases/mysql')); // MySQL

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

// publicKey / privateKey 생성
const getGenerateVAPIDKeys = function() { 
	// web push 프로토콜에서 요구되는 암호키 (base64 인코딩 값)
	// 서버 공개키/비공개키 생성 도움 사이트: https://web-push-codelab.glitch.me/
	// GCMAPIKey 가 변경되었을 경우, 다시 생성한다.
	// VAPID 키가 없거나 잘못되었을 경우, 다시 생성한다.
	// VAPID 키를 다시 생성할 경우, 클라이언트 (사용자가 보는 html 파일의 푸시 vapidPublicKey 값) publicKey 키도 변경해줘야한다.
	return webpush.generateVAPIDKeys();
};

// 필수값 검사
if(!webpushConfig || typeof webpushConfig !== 'object') {
	console.log('config file 에러!');
	process.exit();
}else if(!webpushConfig.GCMAPIKey) {
	console.log('Google Cloud Messaging API Key 에러!');
	process.exit();
}else if(!webpushConfig.publicKey || !webpushConfig.privateKey) {
	console.log('VAPIDKeys(publicKey/privateKey) 에러!');
	// webpush.generateVAPIDKeys 함수 호출하여 새로운 키 발급 해야합니다.
	//webpushConfig = { ...webpushConfig, ...getGenerateVAPIDKeys(), };
	process.exit();
}

/**
 * Web Push 
 * (FCM 은 HTTP 방식, HTTP v1 방식 있음) - FCM HTTP v1 API는 수명이 짧은 OAuth 2.0 액세스 토큰을 사용하여 요청
 * 
 * 웹푸시 프로토콜
 * https://tools.ietf.org/html/draft-ietf-webpush-protocol
 * 
 * HTTP 방식
 * https://firebase.google.com/docs/cloud-messaging/auth-server#authorize-legacy-protocol-send-requests
 * https://firebase.google.com/docs/cloud-messaging/send-message#send_using_the_fcm_legacy_http_api
 * 
 * web-push 패키지 참고
 * https://github.com/web-push-libs/web-push/blob/master/src/web-push-lib.js
 * 
 * method: POST
 * headers: {
 * 		Content-Type: 'application/octet-stream', // 'application/json', 'application/x-www-form-urlencoded;charset=UTF-8'
 * 		Authorization: 'key=' + GCMAPIKey, // YOUR_SERVER_KEY
 * 		body: {웹푸시 값들} encrypt 값,
 * 		endpoint: subscription.endpoint,
 * }
 */
// FCM 프로젝트에서의 클라우딩메시징 서버키 
// https://console.firebase.google.com/u/0/project/webpush-128d1/settings/cloudmessaging
let { GCMAPIKey=''/*Google Cloud Messaging API Key*/, publicKey=''/*공개키 : 클라이언트 (웹푸시를 사용하는 쪽 코드) 에서 사용*/, privateKey=''/*비밀키*/, } = webpushConfig;
try {
	webpush.setGCMAPIKey(GCMAPIKey);
	webpush.setVapidDetails('mailto:yu9221@gmail.com', publicKey, privateKey);
}catch(error) {
	// publicKey / privateKey 오류가 있을 경우 키 재생성 해야한다.
	console.log('FCM 값 설정 에러!', error);
	// publicKey / privateKey 키 재생성
	// publicKey / privateKey 키 재생성
	({ publicKey, privateKey, } = getGenerateVAPIDKeys()); 
	console.log('VAPIDKeys 신규 생성', `${publicKey} / ${privateKey}`); // 보안 주의!
	process.exit();
}

// subscription
// 사용자 페이지에서 공개키 + registration.pushManager.subscribe 함수를 통해 생성되는 각 클라이언트(구분) 정보
/*subscription = {
	endpoint: '< Push Subscription URL >',
	keys: {
		p256dh: '< User Public Encryption Key >',
		auth: '< User Auth Secret >'
	}
};*/

// Koa context 속성 추가 
if(!webpush.publicKey) {
	webpush.publicKey = publicKey;
}
app.context.webpush = webpush; // ctx.webpush 형태로 접근해서 사용

// router
//router.use('/test', require(path.resolve(__dirname, '../routes/webpush')).routes());
router.use(require(path.resolve(__dirname, '../routes/webpush')).routes());

// server listen
const server = app.listen(env.pushPort, () => {
	console.log('WebPush Test Server', env.pushPort);
});