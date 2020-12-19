/*
if('serviceWorker' in navigator) {
	window.addEventListener('load', function() {
		navigator.serviceWorker.register('/service-worker.js');
	});
}

-
WorkBox
https://github.com/GoogleChrome/workbox
https://github.com/GoogleChrome/workbox/releases
https://glitch.com/@philkrie/workbox-demos
https://developers.google.com/web/tools/workbox/guides/get-started
https://developers.google.com/web/tools/workbox/reference-docs/latest
https://developers.google.com/web/tools/workbox/reference-docs/v4/

* WorkBox 라이센스
https://github.com/GoogleChrome/workbox/blob/master/LICENSE

* npm 또는 yarn 으로 WorkBox 모듈을 설치해 사용하는 방식 참고

* WorkBox-Webpack-Plugin
https://developers.google.com/web/tools/workbox/modules/workbox-webpack-plugin


-
API 문서
https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox
workbox
workbox.backgroundSync
workbox.broadcastUpdate
workbox.cacheableResponse
workbox.core
workbox.expiration
workbox.googleAnalytics
workbox.loadModule(moduleName)
workbox.navigationPreload
workbox.precaching
workbox.rangeRequests
workbox.routing
workbox.setConfig(options)
workbox.strategies
workbox.streams
workbox~ModulePathCallback(moduleName, debug)


-
서비스워커 업데이트가 발생할 때
> navigator.serviceWorker.register() 신규 호출
> 브라우저에 의한 자동 Update - 기존 등록된 서비스워커와 다른 파일내부 변경이력, HTTP Header Cache-Control max-age(최대24시간), 개발자도구 Service Workers 탭의 'Update on Reload' 페이지 새로고침시 업데이트 체크 등
> client request 처리시 - fetch
> 24시간내(Cache-Control max-age) 업데이트 확인이 없는 상태에서 push 및 sync 이벤트 발생시
> registration.update(), registration.unregister() 명시적 호출시

https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle
https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9
https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/http-caching


-
캐싱 전략 - strategies
https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook
https://developers.google.com/web/tools/workbox/reference-docs/latest/module-workbox-strategies

1. cacheFirst
캐시에 있는지 우선확인하고, 없으면 네트워크에 접근해 리소스를 보여준다.

2. cacheOnly
캐시에 있는 리소스만 사용한다.

3. networkFirst
네트워크에 우선 접근하고, 오프라인 경우만 캐시 리소스를 확인한다.

4. networkOnly
캐시를 사용하지 않으며, 캐시가 필요없는 GET 메소드가 아닌 다른 메소드가 주로 여기에 해당된다.

5. staleWhileRevalidate
캐시에 있는 데이터를 먼저 브라우저에 반환해주고,
네트워크에 리소스를 요청해 캐시에 저장하여, 기존 캐시 리소스를 업데이트 한다.

6. Cache then network
페이지가 두 개의 요청(캐시에 요청, 네트워크에 요청)을 동시에 하고 
캐시된 데이터를 먼저 표시한 다음 네트워크 데이터가 도착하면 
페이지를 업데이트를 한다.
*/

// WorkBox 사용 - v4 와 v5 로직이 다르다.
//importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.2.0/workbox-sw.js");
//importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js');
//importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');
importScripts('/workbox/5.1.2/workbox-sw.js');
importScripts('/workbox/5.1.2/workbox-core.prod.js');
importScripts('/workbox/5.1.2/workbox-precaching.prod.js');
importScripts('/workbox/5.1.2/workbox-routing.prod.js');
importScripts('/workbox/5.1.2/workbox-strategies.prod.js');
importScripts('/workbox/5.1.2/workbox-expiration.prod.js');

const setWorkBoxRun = workbox => {
	// 캐시 이름 
	const CACHE_NAME = 'TEST_CACHE';
	const CACHE_NAME_JS = [CACHE_NAME, 'JS'].join('_');
	const CACHE_NAME_CSS = [CACHE_NAME, 'CSS'].join('_');
	const CACHE_NAME_FONT = [CACHE_NAME, 'FONT'].join('_');
	const CACHE_NAME_IMAGE = [CACHE_NAME, 'IMAGE'].join('_');

	// context 유효 확인 
	const isObject = (value) => value && typeof value === 'object';
	const isContext = context => (isObject(context) && isObject(context.url) && isObject(context.request) && isObject(context.event)) ? context : false;
	// MIME 유형 확인 (Content-Type응답 헤더)
	const isAccept = (context, mime="") => (isContext(context) && context.request.headers) ? context.request.headers.get("accept").includes(mime) : false;
	// hostname 확인 - hostname 은 host 에서 포트번호를 제거한 부분 - 예: local-markup.cjmall.com
	const isHostname = (context, hostname="") => (isContext(context) && context.url.hostname) ? context.url.hostname.includes(hostname) : false;
	// origin 확인 - 예: https://local-markup.cjmall.com
	const isOrigin = (context, origin="") => (isContext(context) && context.url.origin) ? context.url.origin.includes(origin) : false;
	// pathname 확인 - 예: /unsafe/831x300/image.cjmall.net/public/confirm/assets/tdp_cate_cont/202007/03/2547319/e7360842c9200ed0140bf8dedda8b28bc7f02067.jpg
	const isPathname = (context, pathname="") => (isContext(context) && context.url.pathname) ? context.url.pathname.includes(pathname) : false;
	// 확장자 확인
	const isExtension = (context, extension=[]) => (isContext(context) && context.request.url && Array.isArray(extension)) ? new RegExp(`.*\.(?:${extension.join('|')})$`).test(context.request.url) : false;

	// 모듈 로드 (workbox-sw.js 모듈내부 추가 필요모듈 비동기 로그 실행코드가 있으나, 타이밍 차이 발생 방지, 안정성)
	// 구글 CDN에서 모듈을 다운로드
	//workbox.loadModule("workbox-core");
	//workbox.loadModule("workbox-routing");
	//workbox.loadModule("workbox-strategies");
	//workbox.loadModule("workbox-expiration");
	//const { precaching, routing, strategies } = workbox;

	// 설정 
	/*workbox.setConfig({
		debug: true
	});*/
	workbox.core.skipWaiting(); // 서비스 워커 즉시 활성화 - 업데이트된 서비스워커를 브라우저 재시작(또는 탭 재시작)후 활성이 아닌, 업데이트된 즉시 활성
	workbox.core.clientsClaim(); // 서비스 워커 활성화되면, 현재 사용 가능한 클라이언트 요청

	// 프리로드 리스트 
	/*workbox.precaching.precacheAndRoute([
		// 리소스 리스트
		{url: '/index.html', revision: '383676' },
		{url: '/styles/app.0c9a31.css', revision: null},
		'https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta/css/bootstrap.min.css'
	]);*/

	// 라우트
	//registerRoute(capture, handler, method)
	workbox.routing.registerRoute(
		context => {
			// context.url : URL
			/*
			{
				hash: ""
				host: "local-markup.cjmall.com" 
				hostname: "local-markup.cjmall.com" // hostname은 host에서 포트번호를 제거한 부분
				href: "https://local-markup.cjmall.com/webjars/ec-markup-common/dist/common-cjos-mobile/others/css/common.cjos.mobile.css"
				origin: "https://local-markup.cjmall.com"
				password: ""
				pathname: "/webjars/ec-markup-common/dist/common-cjos-mobile/others/css/common.cjos.mobile.css"
				port: ""
				protocol: "https:"
				search: ""
				searchParams: URLSearchParams {}
				username: ""
			}
			*/
			// context.request : Request
			/*
			{
				bodyUsed: false
				cache: "reload"
				credentials: "include"
				destination: "style"
				headers: Headers {}
				integrity: ""
				isHistoryNavigation: false
				keepalive: false
				method: "GET"
				mode: "no-cors"
				redirect: "follow"
				referrer: "https://local-display.cjmall.com/m/homeTab/main?hmtabMenuId=000002&rPIC=Oclock"
				referrerPolicy: "no-referrer-when-downgrade"
				signal: AbortSignal {aborted: false, onabort: null}
				url: "https://local-markup.cjmall.com/webjars/ec-markup-common/dist/common-cjos-mobile/others/css/common.cjos.mobile.css"
			}
			*/
			// context.event : FetchEvent
			/*
			{
				bubbles: false
				cancelBubble: true
				cancelable: true
				clientId: "e0380359-b069-4a1e-9337-58bc21aacf1e"
				composed: false
				currentTarget: ServiceWorkerGlobalScope {clients: Clients, registration: ServiceWorkerRegistration, serviceWorker: ServiceWorker, onactivate: null, onfetch: null, …}
				defaultPrevented: false
				eventPhase: 0
				isReload: false
				isTrusted: true
				path: []
				preloadResponse: Promise {<resolved>: undefined}
				request: Request {method: "GET", url: "https://local-markup.cjmall.com/webjars/ec-markup-…mon-cjos-mobile/others/css/common.cjos.mobile.css", headers: Headers, destination: "style", referrer: "https://local-display.cjmall.com/m/homeTab/main?hmtabMenuId=000002&rPIC=Oclock", …}
				resultingClientId: ""
				returnValue: true
				srcElement: ServiceWorkerGlobalScope {clients: Clients, registration: ServiceWorkerRegistration, serviceWorker: ServiceWorker, onactivate: null, onfetch: null, …}
				target: ServiceWorkerGlobalScope {clients: Clients, registration: ServiceWorkerRegistration, serviceWorker: ServiceWorker, onactivate: null, onfetch: null, …}
				timeStamp: 0
				type: "fetch"
			}
			*/
			console.log('context', context);
			console.log('hostname', context.url.hostname);
			console.log(isHostname(context, 'localhost'));
			console.log('accept', context.request.headers.get("accept"));
			return false;
		}, 
		new workbox.strategies.NetworkOnly()
	);

	// HTML 파일은 무조건 네트워크
	workbox.routing.registerRoute(
		context => isAccept(isContext(context), 'text/html'),
		new workbox.strategies.NetworkOnly()
	);

	// 폰트 리소스 
	workbox.routing.registerRoute(
		new RegExp('.*\.(?:eot|woff2|woff|ttf)$'),
		new workbox.strategies.StaleWhileRevalidate({
			cacheName: CACHE_NAME_FONT
		})
	);

	// 이미지 리소스
	// //thumb.cjmall.net/unsafe/550x550/itemimage.cjmall.net/goods_images/63/590/63393590L.jpg?timestamp=20200327123009
	// //thumb.cjmall.net/unsafe/831x300/image.cjmall.net/public/confirm/assets/tdp_cate_cont/202007/03/2547319/e7360842c9200ed0140bf8dedda8b28bc7f02067.jpg
	workbox.routing.registerRoute(
		// https://bc.ad.daum.net 처럼 Accept 타입이 'image/webp,image/apng,image/*,*/*;q=0.8' 으로 request 되는 파일이 존재함 
		//context => isAccept(isContext(context), 'image/'),
		//context => isExtension(isContext(context), ['png', 'gif', 'jpg', 'jpeg', 'svg']),
		//context => isContext(context) && (isHostname(context, 'image.cjmall.net') || isPathname(context, '/image.cjmall.net/')) && isExtension(context, ['png', 'gif', 'jpg', 'jpeg']),
		//context => isContext(context) && (/\/\/(dev-image2|image)\.cjmall\.(net|com)\/public\/confirm\/assets/i.test(context.url.origin) || /\/(dev-image2|image)\.cjmall\.(net|com)\/public\/confirm\/assets/.test(context.url.pathname)) && isExtension(context, ['png', 'gif', 'jpg', 'jpeg']),
		new RegExp('.*\.(?:png|gif|jpg|jpeg|svg)$'),
		new workbox.strategies.StaleWhileRevalidate({
			cacheName: CACHE_NAME_IMAGE,
			plugins: [
				// 만료 관련 플러그인 
				new workbox.expiration.ExpirationPlugin({
					maxEntries: 60, // 캐시 할 최대 리소스 수
					maxAgeSeconds: 1 * 24 * 60 * 60, // 1 Days - 86400 초 
				})
			],
			fetchOptions: {},
			matchOptions: {}
		})
	);

	// 특정 URI css 파일 
	/*workbox.routing.registerRoute(
		context => isContext(context) && isHostname(context, 'localhost') && isAccept(context, 'text/css'),
		new workbox.strategies.StaleWhileRevalidate({
			cacheName: CACHE_NAME_CSS
		})
	);*/

	// 특정 URI js 파일
	/*workbox.routing.registerRoute(
		// 'text/javascript' Accept 값으로 확인 할 경우, API 호출 데이터까지 범위에 들어 갈 수 있다.
		context => isContext(context) && isHostname(context, 'localhost') && isExtension(context, ['js']),
		new workbox.strategies.StaleWhileRevalidate({
			cacheName: CACHE_NAME_JS
		})
	);*/

	// css/js
	workbox.routing.registerRoute(
		// 'text/javascript' Accept 값으로 확인 할 경우, API 호출 데이터까지 범위에 들어 갈 수 있다.
		//context => isContext(context) && (isHostname(context, 'cjmall.net') || isHostname(context, 'cjmall.com')) && isExtension(context, ['css', 'js']),
		context => isContext(context) && isExtension(context, ['css', 'js']),
		new workbox.strategies.StaleWhileRevalidate({
			cacheName: CACHE_NAME
		})
	);

	// fallbacks
	// https://developers.google.com/web/tools/workbox/guides/advanced-recipes#comprehensive_fallbacks
	workbox.routing.setCatchHandler(({ event }) => {
		// The FALLBACK_URL entries must be added to the cache ahead of time, either
		// via runtime or precaching. If they are precached, then call
		// `matchPrecache(FALLBACK_URL)` (from the `workbox-precaching` package)
		// to get the response from the correct cache.
		//
		// Use event, request, and url to figure out how to respond.
		// One approach would be to use request.destination, see
		// https://medium.com/dev-channel/service-worker-caching-strategies-based-on-request-types-57411dd7652c
		switch(event.request.destination) {
			case 'document':
				// If using precached URLs:
				// return matchPrecache(FALLBACK_HTML_URL);
				//return caches.match(FALLBACK_HTML_URL);
			break;

			case 'image':
				// If using precached URLs:
				// return matchPrecache(FALLBACK_IMAGE_URL);
				//return caches.match(FALLBACK_IMAGE_URL);
			break;
		
			case 'font':
				// If using precached URLs:
				// return matchPrecache(FALLBACK_FONT_URL);
				//return caches.match(FALLBACK_FONT_URL);
			break;
		
			default:
				// If we don't have a fallback, just return an error response.
				return Response.error();
		}
	});
};

// workbox 변수 존재 확인 
if(workbox) {
	console.log(`Workbox is loaded.`);
	setWorkBoxRun(workbox);
}