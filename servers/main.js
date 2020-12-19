/*
-
Koa
https://koajs.com/#context
*/
// require
const path = require('path'); 
const Koa = require('koa');
const Router = require('koa-router');
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