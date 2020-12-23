const path = require('path'); 

const Router = require('koa-router');
const router = new Router();
const pushCtrl = require(path.resolve(__dirname, '../controllers/webpush'));

/*router.post('/', pushCtrl.create);
router.delete('/', pushCtrl.delete);
router.put('/', pushCtrl.replace);
router.patch('/', pushCtrl.update);*/

// 사용자 브라우저 푸시정보와 서버 푸시정보 일치여부 확인 
router.get('/push-check', (ctx, next) => {
	// ctx; // is the Context
	// ctx.request; // is a Koa Request
	// ctx.response; // is a Koa Response
	// ctx.webpush; // app.context.webpush 수동으로 추가된 값

	// getter, setter 형태로 접근
	const { request, response, cookies, params, webpush } = ctx;
	const { method, query, body, } = request;
	
	/*
	vapidKeys.publicKey
	vapidKeys.privateKey
	request.query.subscription
	*/
	
	// response.type = 'text/plain; charset=utf-8' | 'image/png'
	// response.body = string | Buffer | Stream | Object (json-stringified) | null
	response.body = `push-check (${method})`;
});

// 푸시 허용 (사용자 subscribe 정보 저장)
router.post('/push-subscribe', (ctx, next) => {
	// ctx; // is the Context
	// ctx.request; // is a Koa Request
	// ctx.response; // is a Koa Response
	// ctx.webpush; // app.context.webpush 수동으로 추가된 값

	// getter, setter 형태로 접근
	const { request, response, cookies, params, webpush } = ctx;
	const { method, query, body, } = request;

	/*
	vapidKeys.publicKey
	vapidKeys.privateKey
	request.body.subscription
	subscription = JSON.parse(request.body.subscription); // 이 토큰을 DB에 저장, 이 토큰으로 사용자에게 계속 푸시메시지를 보낼 수 있다.
	
	// subscription 값 구조 
	{
		endpoint: '', 
		expirationTime: null, 
		keys: {
			p256dh: '', 
			auth: ''
		}
	} 

	// 푸시발송 
	webpush.sendNotification(JSON.parse(request.body.subscription), payload); 
	*/

	// response.type = 'text/plain; charset=utf-8' | 'image/png'
	// response.body = string | Buffer | Stream | Object (json-stringified) | null
	response.body = `push-subscribe (${method})`;
});

// 푸시 거부
router.post('/push-unsubscribe', (ctx, next) => {
	// ctx; // is the Context
	// ctx.request; // is a Koa Request
	// ctx.response; // is a Koa Response
	// ctx.webpush; // app.context.webpush 수동으로 추가된 값

	// getter, setter 형태로 접근
	const { request, response, cookies, params, webpush } = ctx;
	const { method, query, body, } = request;

	/*
	vapidKeys.publicKey
	vapidKeys.privateKey
	request.body.subscription
	subscription = JSON.parse(request.body.subscription);
	subscription.endpoint
	*/

	// response.type = 'text/plain; charset=utf-8' | 'image/png'
	// response.body = string | Buffer | Stream | Object (json-stringified) | null
	response.body = `push-unsubscribe (${method})`;
});

// 사용자가 푸시 확인했음
router.post('/push-confirm', (ctx, next) => {
	// ctx; // is the Context
	// ctx.request; // is a Koa Request
	// ctx.response; // is a Koa Response
	// ctx.webpush; // app.context.webpush 수동으로 추가된 값

	// getter, setter 형태로 접근
	const { request, response, cookies, params, webpush } = ctx;
	const { method, query, body, } = request;

	/*
	request.body.subscription
	subscription = JSON.parse(request.body.subscription);
	*/
	
	// response.type = 'text/plain; charset=utf-8' | 'image/png'
	// response.body = string | Buffer | Stream | Object (json-stringified) | null
	response.body = `push-confirm (${method})`;
});

// 푸시 관리 페이지 접근 (발송/수정/삭제)
router.get('/push-admin', (ctx, next) => {
	// ctx; // is the Context
	// ctx.request; // is a Koa Request
	// ctx.response; // is a Koa Response
	// ctx.webpush; // app.context.webpush 수동으로 추가된 값

	// getter, setter 형태로 접근
	const { request, response, cookies, params, webpush } = ctx;
	const { method, query, body, } = request;

	// return html
	// response.type = 'text/plain; charset=utf-8' | 'image/png'
	// response.body = string | Buffer | Stream | Object (json-stringified) | null
	response.body = `push-admin (${method})`;
});

// 푸시 사용자 리스트 
router.get('/push-send', (ctx, next) => {
	// ctx; // is the Context
	// ctx.request; // is a Koa Request
	// ctx.response; // is a Koa Response
	// ctx.webpush; // app.context.webpush 수동으로 추가된 값

	// getter, setter 형태로 접근
	const { request, response, cookies, params, webpush } = ctx;
	const { method, query, body, } = request;

	// return json
	// response.type = 'text/plain; charset=utf-8' | 'image/png'
	// response.body = string | Buffer | Stream | Object (json-stringified) | null
	response.body = `push-send (${method})`;
});

// 푸시 발송 
router.post('/push-send', (ctx, next) => {
	// ctx; // is the Context
	// ctx.request; // is a Koa Request
	// ctx.response; // is a Koa Response
	// ctx.webpush; // app.context.webpush 수동으로 추가된 값

	// getter, setter 형태로 접근
	const { request, response, cookies, params, webpush } = ctx;
	const { method, query, body, } = request;

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
		// 푸시 제목
		'title': title, 

		// 푸시 내용
		'body': body, 

		// 푸시 알람에 표시될 아이콘
		// 256x256 | larger (jpg, png, gif, webp, ico, cur, bmp)
		'icon': icon, 

		// 배지는 모바일에서만 동작하는 속성
		// 모바일에서 알람을 받았을 때, 상단 상태 바에 표시되는 작은 아이콘
		// 72x72 | larger (png, gif, webp, ico, cur, bmp)
		'badge': badge, 

		// 알람 창 안에 이미지를 표시
		// 512x256px | 1440x720px (jpg, png, gif, webp, ico, cur, bmp)
		'image': image, 

		// 알람이 표시될 때 진동 패턴을 정의 (무음모드가 아닐 경우)
		// window.navigator.vibrate([200, 100, 200]);
		'vibrate': [200, 100, 200, 100, 300], 

		// 알람이 표시될 때 나는 소리를 지정 - '/xx.mp3'
		'sound': '/sound/alarm.mp3', 

		// 사용자 정의 데이터 (사용자가 별도로 params 라는 값을 넣어서 보냄)
		'params': { 
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
	
	// response.type = 'text/plain; charset=utf-8' | 'image/png'
	// response.body = string | Buffer | Stream | Object (json-stringified) | null
	response.body = `push-send (${method})`;
});

// 푸시 사용자 정보 수정
router.put('/push-send', (ctx, next) => {
	// ctx; // is the Context
	// ctx.request; // is a Koa Request
	// ctx.response; // is a Koa Response
	// ctx.webpush; // app.context.webpush 수동으로 추가된 값

	// getter, setter 형태로 접근
	const { request, response, cookies, params, webpush } = ctx;
	const { method, query, body, } = request;

	/*
	vapidKeys.publicKey
	vapidKeys.privateKey
	*/
	
	// response.type = 'text/plain; charset=utf-8' | 'image/png'
	// response.body = string | Buffer | Stream | Object (json-stringified) | null
	response.body = `push-send (${method})`;
});

// 푸시 사용자 정보 제거 
router.delete('/push-send', (ctx, next) => {
	// ctx; // is the Context
	// ctx.request; // is a Koa Request
	// ctx.response; // is a Koa Response
	// ctx.webpush; // app.context.webpush 수동으로 추가된 값

	// getter, setter 형태로 접근
	const { request, response, cookies, params, webpush } = ctx;
	const { method, query, body, } = request;

	/*
	vapidKeys.publicKey
	vapidKeys.privateKey
	*/

	// response.type = 'text/plain; charset=utf-8' | 'image/png'
	// response.body = string | Buffer | Stream | Object (json-stringified) | null
	response.body = `push-send (${method})`;
});

// 백그라운드 동기화 테스트 (네트워크가 불안정한 상태에서 다시 연결되었을 때, 서비스워커가 전송해주는 값)
/*router.get('/background-sync', (ctx, next) => {
	// ctx; // is the Context
	// ctx.request; // is a Koa Request
	// ctx.response; // is a Koa Response
	// ctx.webpush; // app.context.webpush 수동으로 추가된 값

	// getter, setter 형태로 접근
	const { request, response, cookies, params, webpush } = ctx;
	const { method, query, body, } = request;

	// response.type = 'text/plain; charset=utf-8' | 'image/png'
	// response.body = string | Buffer | Stream | Object (json-stringified) | null
	response.body = `background-sync (${method})`;
});*/

module.exports = router;