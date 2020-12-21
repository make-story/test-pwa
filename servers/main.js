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
const Koa = require('koa');
const Router = require('koa-router');
//const koaCors = require('@koa/cors');
//const koaBody = require('koa-body'); // HTTP 메소드 POST 같이 요청 정보를 Body에 포함하는 경우 (ctx.request.body)
const static = require('koa-static');
const send = require('koa-send'); // 정적 파일 서비스 미들웨어


const paths = require(path.resolve(__dirname, '../config/paths'));
const env = require(path.resolve(paths.appPath, 'config/env'));
//console.log('path test', paths.resolveApp('serviceworkers'));

// Koa
const app = new Koa();
const router = new Router();

// middleware
app.use(router.routes());
app.use(router.allowedMethods());
app.use(static(paths.appSrc));
app.use(static(path.resolve(paths.appPath, 'public')));
app.use(static(path.resolve(paths.appPath, 'serviceworkers')));
app.use(static(path.resolve(paths.appPath, 'test')));
app.use(async (ctx) => { 
    // 가상 경로 설정에 대응 (리액트 라우터 등으로 설정된 가상경로의 경우 등)
    if(ctx.status === 404) {
        await send(ctx, '/test/index.html', { root: paths.appPath });
    }
    // 특정 경로의 경우 반환
    /*if(ctx.path === '/test') {
        return ctx.body = 'Try GET /test.json';
    }*/
    // 요청 경로 파일 반환
    //await send(ctx, ctx.path);
});

// route
//router.get('/push', require(path.resolve(paths.appPath, 'routes/webpush')).routes());
/*router.get('/', async (ctx, next) => {
	// ctx.params; // 라우트 경로에서 :파라미터명 으로 정의된 값이 ctx.params 안에 설정됩니다.
    // ctx.request.query; // 주소 뒤에 ?id=10 이런식으로 작성된 쿼리는 ctx.request.query 에 파싱됩니다.
    
    //ctx.set('Content-Type', 'text/html');
    //ctx.body = '홈';
    await send(ctx, 'index.html', { root: paths.appPages + '/' });
});*/

// server listen
const server = app.listen(env.port, () => {
	console.log('PWA Test Server', env.port);
});