
/*
서비스워커
브라우저가 백그라운드에서 실행하는 스크립트로, 웹페이지와는 별개로 작동
푸시알림, 백그라운드 동기화, 주기적 동기화 또는 지오펜싱, 응답캐시
https://caniuse.com/#feat=serviceworkers


-
서비스워커 소개
https://developers.google.com/web/fundamentals/primers/service-workers/
https://developer.mozilla.org/ko/docs/Web/Progressive_web_apps/Offline_Service_workers


-
서비스워커 라이프사이클
https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle


-
gloal 변수는 web worker 동일한 self
https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope


-
서비스워커는 프로미스 기반 동작 event.waitUntil(promise) - promise 가 완료될 때까지 이벤트가 기다림 (install, activate 등 이벤트 내부에서 사용할 경우)


-
서비스워커 코드 또는 버전 변경, 재설치 후 테스트 할 때
테스트하려는 브라우저는 종료 후(탭 등에서 사이트 작동되고 있을 가능성 있음) 테스트 하는 것이 좋다.


-
실행 단계
1. 등록 (브라우저에서 서비스워커 파일 등록)
	navigator.serviceWorker.register('/sw.js')
2. 설치 - 캐시 리스트 등록가능
	self.addEventListener('install', function(event) {})
3. 설치완료 또는 변경(update) 활성화 - 기존 캐시리스트 정리가능
	정상적으로 설치(install)되었을 때 실행됨, 서비스워커 update시 기본적으로 대기(waiting)상태이기 때문에 바로 활성화되지 않음(기존 캐시 유지하기 위함), 그러나 설치(install)에서 대기상태 건너뛰기(skipWaiting)실행될 경우 바로 활성화 실행됨
	self.addEventListener('activate', function(event) {})
4. 리소스 요청시 - 리소스 관리(캐시의 데이터 반환, 캐시에 데이터 추가 등)
	self.addEventListener('fetch', function(event) {})


-
캐싱 전략 
https://jakearchibald.com/2014/offline-cookbook/

staleWhileRevalidate 방식 (많이 사용)
캐시에 있는 데이터를 먼저 브라우저에 반환해주고,
네트워크에 리소스를 요청해 캐시에 저장하여, 기존 캐시 리소스를 업데이트 한다.
이런 식으로 캐시에 있는 파일은 최신 버전을 유지한다.

Cache then network 방식
페이지가 두 개의 요청(캐시에 요청, 네트워크에 요청)을 동시에 하고 
캐시된 데이터를 먼저 표시한 다음 네트워크 데이터가 도착하면 
페이지를 업데이트를 한다.


-
Chrome 75 Webview에서 서비스워커의 fetch request 가 실패하는 문제
UA 에 android, wv 값이 있는 경우 서비스워커를 설치하지 않을 뿐 아니라 설치된 서비스워커를 제거해주는 로직 필요
Chrome 75.0.3770.67 ~ 75.0.3770.101 버전의 모든 안드로이드 웹뷰에서 서비스워커 설치를 차단, 이미 설치가 되어있다면 삭제
*/

// 크롬기준: 탭을 열고 사이트 접속시 또는 서비스워커파일 최초 등록시 아래 전역변수 console 노출 (새로고침시 노출안함)
console.log('---------- ---------- ---------- ----------');
console.log('[Service Worker] 전역변수 self', self);
console.log('[Service Worker] self.clients', self.clients); // Read only
console.log('[Service Worker] self.registration', self.registration); // Read only
console.log('[Service Worker] self.caches', self.caches); // Read only
console.log('---------- ---------- ---------- ----------');

// 날짜 시간
const DATETIME = (function() {
	let date = new Date();
	let value = {
		'year': '' + date.getFullYear(),
		'month': ('0' + (date.getMonth()+1)).slice(-2),
		'day': ('0' + date.getDate()).slice(-2),
		'hour': ('0' + date.getHours()).slice(-2),
		'minute': ('0' + date.getMinutes()).slice(-2),
		'second': ('0' + date.getSeconds()).slice(-2),
	};
	return [
		[value.year, value.month, value.day].join(''),
		[value.hour].join(''),
	].join('-');
})();

// 캐시이름 (서비스워커 설치 및 활성화되었을 때, 기존 캐시 삭제 등 버전관리가 가능하도록 한다.)
// 캐시이름을 변경한다고 하여, 서비스워커 파일이 바로 업데이트(설치, 활성화) 되지는 않는다. 
// update 가 발생(브라우저 자동 또는 개발자도구나 코드상의 수동)했을 때, 기존 설치된 서비스워커와 비교하여 내부 코드수정이 없으면 설치(install)가 발생하지 않는다.
//var CACHE_VERSION = '191010-15'; // 과거 서비스워커 파일과의 버전관리를 위함 (현재 버전은 숫자로 관리하므로, 해당 값은 숫자로 시작하는 정책사용)
const CACHE_VERSION = DATETIME;
const CACHE_NAME_STATIC = 'test-static-'; // 서비스 스코프 및 버전관리를 위함 

// 초기(install 단계) 캐시저장 리소스 리스트 
// [주의!] 서비스워커 fetch, cache 등록하여 사용하는 페이지는 자동으로 'Cache Storage'에 저장된다. 해당 페이지의 변경(마크업 등)이 있을 경우, 서비스워커가 새로등록되도록 해야함(그 경우, 푸시등 처리방안 생각해야함)
const CACHE_LIST = [
	//'/test/offline.html', // 오프라인 전용 페이지를 캐시에 저장해두고, 특정페이지를 불러오지 못했을 경우, 캐시페이지 노출 (폴백)
	//'/favicon.ico',
	'/manifest.json',
	'/image/48x48.png',
	'/image/72x72.png',
	'/image/96x96.png'
];

// 무조건 네트워크 요청 리스트
const NETWORK_LIST = [
	//'/push-subscribe',
	//'/push-unsubscribe',
	//'/push-check'
];

// 폴백 - CACHE_LIST 에 저장된 것만 가능 (즉, 캐시에 있는 데이터만 가능)
const FALLBACK_LIST = { 
	//'/index.html': '/offline.html'
};

// 캐싱 처리하고 싶은 content-type
const CACHE_CONTENTTYPE_LIST = [
	'image/png',
	'image/gif',
	'image/jpeg',
	'application/font-woff'
];


/*(() => {
	const STATIC_CACHE_NAME = 'STATIC_CACHE_VERSION_1'; // 초기 고정으로 저장되는 캐시
	const DYNAMIC_CACHE_NAME = 'DYNAMIC_CACHE_VERSION_1'; // fetch 에 따라 저장되는 캐시 
  
	const WEB_CACHE = {
	  init() {
		self.addEventListener('install', this.staticCacheStrategy.bind(this));
		self.addEventListener('activate', this.deleteOldCache.bind(this));
		self.addEventListener('fetch', this.dynamicCacheStrategy.bind(this));
	  }
  
	  staticCacheStrategy(event) {
		// 스태틱 캐싱
	  },
  
	  deleteOldCache(event) {
		// 캐시 삭제
	  },
  
	  dynamicCacheStrategy(event) {
		// 다이나믹 캐싱
	  }
	};
  
	WEB_CACHE.init();
})();*/


// 1. 서비스 워커 설치
/*
사용자가 서비스워커를 처음 설치하거나, 기존 서비스워커가 업데이트 되었을 때 실행됩니다.
서비스 워커는 설치 후 '활성화(activate)'될 때까지 fetch 및 push와 같은 이벤트를 수신하지 않습니다.
리소스 다운로드 및 캐시에 실패하면 설치되지 않습니다. (파일이 하나라도 실패하면 전체 캐시 단계가 실패)
*/
self.addEventListener('install', function(event) {
	console.log('[Service Worker] install 이벤트 실행', event);

	/*
	-
	기본적으로 CORS를 지원하지 않는 타사 URL에서 리소스를 가져오는 작업은 실패합니다. 
	이 문제를 해결하기 위해 요청에 no-CORS 옵션을 추가할 수 있지만, 이 경우 '불투명(opaque)' 응답이 발생하여 응답의 성공 여부를 구별할 수 없습니다.
	var urlsToPrefetch = [
		'./static/pre_fetched.txt',
		'./static/pre_fetched.html',
		'https://www.chromium.org/_/rsrc/1302286216006/config/customLogo.gif'
	];
	cache.addAll(urlsToPrefetch.map(function(urlToPrefetch) {
		return new Request(urlToPrefetch, {mode: 'no-cors'});
	})).then(function() {
		console.log('[Service Worker] All resources have been fetched and cached.');
	});

	// 또는
	// https://github.com/GoogleChrome/samples/blob/gh-pages/service-worker/prefetch/service-worker.js

	var now = Date.now();
	var cachePromises = urlsToPrefetch.map(function(urlToPrefetch) {
		var url = new URL(urlToPrefetch, location.href);
		url.search += (url.search ? '&' : '?') + 'cache-bust=' + now;
		var request = new Request(url, {mode: 'no-cors'});

		return fetch(request).then(function(response) {
			if(response.status >= 400) {
				throw new Error('request for ' + urlToPrefetch + ' failed with status ' + response.statusText);
			}
			return cache.put(urlToPrefetch, response);
		}).catch(function(error) {
			console.error('[Service Worker] Not caching ' + urlToPrefetch + ' due to ' + error);
		});
	});
	return Promise.all(cachePromises).then(function() {
		console.log('[Service Worker] Pre-fetching complete.');
	});
	*/

	// 캐시이름으로 캐시를 열고, 그 하위로 캐시리스트(리소스)를 저장
	event.waitUntil( 
		caches
		.open(CACHE_NAME_STATIC + CACHE_VERSION)
		.then(function(cache) {
			// 서버에서 URL을 가져오고 응답을 캐시에 추가 
			// (파일이 하나라도 실패하면 전체 캐시 단계가 실패)
			//console.log(`[Service Worker] Opened '${CACHE_NAME_STATIC + CACHE_VERSION}' cache list (캐시에 저장할 데이터 리스트)`, CACHE_LIST);
			console.log('[Service Worker] cache open', CACHE_NAME_STATIC + CACHE_VERSION);
			console.log('[Service Worker] cache list', CACHE_LIST);
			// cache.add(); // 한개 등록
			return cache.addAll(CACHE_LIST);
		})
		.then(function() {
			// update 후 대기 없이 수정 캐시리스트 활성화(activate) 
			// 서비스워커는 기본적으로 업데이트가 발생하면, 신규 업데이트에 대한 설치(install)만 이루어지고, 기존 활성화상태(캐시)는 유지되며, 신규 업데이트에 대한 활성화(캐시)는 실행되지 않고 대기상태가 됨
			// 새로고침이 아닌 탭으로 새롭게 접속해야 신규 업데이트가 대기상태에서 활성화(캐시)상태로 변경됨 (크론 개발자 도구 'Update on Reload' 체크된 경우 제외)
			// 대기 단계는 한 번에 하나의 사이트 버전만 실행하고 있음을 의미하지만, 해당 기능이 필요하지 않은 경우 self.skipWaiting()을 호출하여 새 서비스 워커를 더 빨리 활성화할 수 있습니다.
			console.log('[Service Worker] skipWaiting (update 후 대기 없이 수정 캐시리스트 활성화)');
			return self.skipWaiting();
		})
		.catch(function(e) {
			console.log('[Service Worker] install error', e);
		})
	);
});

// 2. 서비스 워커 설치에 따른 활성화 (캐시관리 가능) - 정상적으로 설치(install) 되지 않으면 활성화되지 않는다.
/*
activate 콜백에서 발생하는 한 가지 공통 작업은 캐시 관리입니다. 
activate 콜백 단계에서 캐시 관리를 하는 이유는 설치 단계에서 이전 캐시들을 다 제거하면 
현재 페이지를 제어하는 이전 서비스 워커가 해당 페이지에 필요한 캐시 파일을 제공하지 못하게 되기 때문입니다. (즉, 기존페이지가 활성화 되어있을 경우, 해당 페이지에서 사용중인 캐시가 있을 수 있기 때문)
*/
self.addEventListener('activate', function(event) {
	console.log('[Service Worker] activate 이벤트 실행', event);

	/*
	'my-site-cache-v1'라는 캐시를, 페이지에 대한 캐시와 블로그 게시물에 대한 캐시로 나눈다고 가정
	이 경우 설치 단계에서 'pages-cache-v1'과 'blog-posts-cache-v1' 등 두 개의 캐시를 만들고, 활성화 단계에서 이전 캐시인 'my-site-cache-v1'을 삭제해야 합니다.
	이를 위해 아래 코드에서는 서비스 워커의 모든 캐시를 반복 탐색하고, 캐시 화이트리스트에 정의되지 않은 캐시를 삭제합니다.
	*/

	// 제거하지 않을 캐시 리스트 (동일 도메인의 다른 스코프에 있는 서비스워커 캐시 삭제 주의!)
	var cacheWhitelist = [CACHE_NAME_STATIC + CACHE_VERSION];

	// 캐시 새로고침
	// 캐시 스토리지의 모든 스토리지명을 가져온다.
	event.waitUntil( 
		caches
		.keys()
		.then(function(cacheList) {
			console.log('[Service Worker] Cache Storage 정보', cacheList);
			return Promise.all(
				cacheList.map(function(cacheNameVersion) {
					var cacheName = /^[^\d.*]*/ig.exec(cacheNameVersion); // 버전관리를 위한 서비스워커 저장 캐시 Name 확인 
					console.log('[Service Worker] cacheName', cacheName);
					if(cacheName && cacheName[0] === CACHE_NAME_STATIC && cacheWhitelist.indexOf(cacheNameVersion) === -1) { // 현재 버전이 아닌 과거버전 확인 
						// 기존버전 제거 
						console.log(`[Service Worker] caches delete ${cacheNameVersion}`);
						return caches.delete(cacheNameVersion);
					}
				})
			);
		})
		.catch(function(e) {
			console.log('[Service Worker] activate error', e);
		})
	);

	// 푸시 토큰 변경
	// ... 코드추가

	// 서비스 워커가 활성화되면 서비스 워커 내에서 clients.claim()을 호출하여 제어되지 않은 클라이언트를 제어할 수 있습니다.
	return self.clients.claim();
});

// 3. 리소스 요청에 대한 캐시데이터 확인 및 반환 - 현재 서비스워커가 설치된 페이지의 모든 request를 관리합니다.
self.addEventListener('fetch', function(event) {
	console.log('[Service Worker] fetch 이벤트 실행', event);

	/*
	// request 정보 
	// https://developer.mozilla.org/ko/docs/Web/API/Request
	event.request.url
	event.request.method
	event.request.headers
	event.request.body
	*/

	// 요청정보 (hostname, origin, pathname, method 등 값에 따라 작업분기 가능)
	var requestURL = new URL(event.request.url);
	console.log('[Service Worker] request 정보', requestURL);

	// 네트워크 리소스 요청 실패의 경우
	var setFetchCatch = function(e) {
		console.log('[Service Worker] fetch error', e);

		//var hash = '#' + encodeURIComponent('{"url":"' + event.request.url + '"}');

		// html 등의 요청 경우, 에러 페이지 반환
		// 해당 에러페이지에는 오프라인 여부 등 내용 표기

		// 1. 캐시 리소스 반환 (NETWORK_LIST 네트워크 리소스를 우선하는 로직에서, 실패할 경우 캐시 데이터 사용 형태)
		//return caches.match(event.request);

		// 2. fallback (네트워크, 캐시 모두 실패할 경우 폴백)
		if(requestURL.pathname in FALLBACK_LIST && CACHE_LIST.indexOf(FALLBACK_LIST[requestURL.pathname]) !== -1) {
			return caches.match(FALLBACK_LIST[requestURL.pathname]);
		}else if(event.request.mode === 'navigate') { // 주소창에서 호출 발생 
			return caches.match('/offline.html');
		}else {
			return null;
		}
	};

	/*
	// 템플릿/데이터 조립하여 반환
	event.respondWith(
		Promise.all([
			caches.match('/template.html').then(function(response) {
				return response.text();
			}),
			caches.match('path.json').then(function() {
				return response.json();
			})
		])
		.then(function(response) {
			var template = response[0];
			var json = response[1];

			return renderTemplate(template, json);
		});
	*/

	// 우선적으로 캐시에서 요청 리소스를 찾습니다.
	event.respondWith(
		caches
		.match(event.request) 
		.then(function(response) {
			var fetchRequest;

			// Request method POST 경우 cache에 바로 저장못하며, indexedDB 등에 저장하는 별도 로직 필요
			if(event.request.method !== 'GET' || NETWORK_LIST.indexOf(requestURL.pathname) !== -1) {
				// 1. 네트워크 리소스 요청 / 응답 반환
				// 캐시에 없으므로 네트워크 요청을 한다.
				// 해당 호출은 네트워크 요청을 수행하고 네트워크에서 검색한 데이터가 있으면 해당 데이터를 반환합니다. 
				console.log('[Service Worker] 네트워크를 통해 데이터 요청', event.request);
				return fetch(event.request)
				.catch(setFetchCatch);
			}else if(response) {
				// 2. 캐시 데이터 반환
				// 일치하는 응답이 있는 경우 캐시된 값을 반환합니다. 
				console.log('[Service Worker] 캐시에 저장되어있던 데이터 반환', event.request);
				return response;
			}else {
				// 3. 네트워크 리소스 요청 / 응답 캐시 저장 및 반환
				// 새로운 요청을 누적적으로 캐시하려면 
				// 아래와 같이 fetch 요청의 응답을 처리한 다음 캐시에 추가하면 됩니다.
				console.log('[Service Worker] 네트워크를 통해 데이터 요청(캐시에 없는 데이터)', event.request);
				fetchRequest = event.request.clone();
				return fetch(fetchRequest)
				.then(function(response) {
					var responseToCache;

					// 네트워크 오류 확인 
					// https://fetch.spec.whatwg.org/#http-fetch
					console.log('[Service Worker] 네트워크 응답', response);
					if(!response || response.status >= 400 || response.type === 'error' || (event.request.mode === 'same-origin' && response.type === 'cors') || (event.request.mode !== 'no-cors' && response.type === 'opaque') || (event.request.redirect !== 'manual' && response.type === 'opaqueredirect')) {
						console.log('[Service Worker] 네트워크 요청 실패 (서비스워커 스코프 범위가 아닐 수 있음)', response);
						throw Error('response status ' + response.status);
					}else if(response.status === 200 && response.type === 'basic') {
						/*
						-
						응답데이터 확인 및 캐시에 추가 순서
						1. fetch 요청 .then() 콜백을 추가합니다.
						2. 응답을 받으면 응답이 유효한지 확인합니다.
						3. 응답에서 상태가 200인지 확인합니다.
						4. 응답 유형이 내부 리소스를 요청한 것임을 나타내는 basic인지 확인합니다. 외부 리소스에 대한 요청은 캐시되지 않음을 의미합니다.
						5. 확인을 통과하면 응답을 복제합니다. 그 이유는 응답이 Stream이고 본문은 한 번만 사용할 수 있기 때문입니다. 브라우저가 사용할 응답을 반환하고 캐시로도 전달하려면 하나는 브라우저로, 다른 하나는 캐시로 보낼 수 있도록 응답을 복제해야 합니다.
						*/
						// 브라우저가 사용할 응답(데이터)을 반환하고 캐시로도 전달하려면,
						// 하나는 브라우저로, 다른 하나는 캐시로 보낼 수 있도록 응답을 복제해야 합니다. (response 본문은 한 번만 사용할 수 있기 때문)
						// (즉, 네트워크로 불러온 데이터를 하나를 브라우저로 보내고, 하나는 복사해서 캐시에 담는다. 다음에 호출할 때는 네트워크가 아닌 캐시에서 바로 사용할 수 있도록 하기 위함)
						/*responseToCache = response.clone();
						caches.open(CACHE_NAME_STATIC + CACHE_VERSION)
						.then(function(cache) {
							console.log(`[Service Worker] 네트워크 요청 데이터 캐시에 추가 (${CACHE_NAME_STATIC + CACHE_VERSION})`, responseToCache);
							cache.put(event.request, responseToCache);
						});*/

						// cross domain request
						// response header에서 content-type을 가져와 비교한다.
						// 아니면 request.url이 캐싱처리를 할 외부 url인지 확인한다.
						responseToCache = response.clone();
						if(CACHE_CONTENTTYPE_LIST.indexOf(response.headers.get('content-type')) !== -1 || event.request.url.indexOf('external.url') !== -1) {
							caches.open(CACHE_NAME_STATIC)
							.then(cache => {
								console.log(`[Service Worker] 네트워크 요청 데이터 캐시에 추가 (${CACHE_NAME_STATIC + CACHE_VERSION})`, responseToCache);
								cache.put(event.request, responseToCache);
							});
						}
					}

					// 응답 반환
					return response;
				})
				.catch(setFetchCatch);
			}
		})
	);
});

// stale-while-revalidate 정책 구현
/*self.addEventListener('fetch', event => {
	if(event.request.mode === 'navigate') {
		// See /web/fundamentals/getting-started/primers/async-functions
		// for an async/await primer.
		event.respondWith(async function() {
			// Optional: Normalize the incoming URL by removing query parameters.
			// Instead of https://example.com/page?key=value,
			// use https://example.com/page when reading and writing to the cache.
			// For static HTML documents, it's unlikely your query parameters will
			// affect the HTML returned. But if you do use query parameters that
			// uniquely determine your HTML, modify this code to retain them.
			const normalizedUrl = new URL(event.request.url);
			normalizedUrl.search = '';

			// Create promises for both the network response,
			// and a copy of the response that can be used in the cache.
			const fetchResponseP = fetch(normalizedUrl);
			const fetchResponseCloneP = fetchResponseP.then(r => r.clone());

			// event.waitUntil() ensures that the service worker is kept alive
			// long enough to complete the cache update.
			event.waitUntil(async function() {
				const cache = await caches.open('my-cache-name');
				await cache.put(normalizedUrl, await fetchResponseCloneP);
			}());

			// Prefer the cached response, falling back to the fetch response.
			return (await caches.match(normalizedUrl)) || fetchResponseP;
		}());
	}
});*/

// ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- 

// client(브라우저->서비스워커) 부터 받은 메시지 - postMessage
// http://craig-russell.co.uk/2016/01/29/service-worker-messaging.html#.WzhyPlOFMy4
self.addEventListener('message', function(event) {
	console.log('[Service Worker] message 이벤트 실행', event);

	// skipWaiting
	/*if(event.data.action === 'skipWaiting') {
		self.skipWaiting();
	}*/

	// 특정 포트에 메시지 전달 
	if(event.ports.length) {
		event.ports[0].postMessage("서비스워커가 특정 클라이언트에 보내는 메시지 입니다.");
	}

	// 클라이언트에 메시지 전달 
	self.clients.matchAll().then(function(clients) {
		clients.forEach(function(client) {
			client.postMessage('서비스워커가 모든 클라이언트에 보내는 메시지 입니다.');
		});
	});
});

// ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- 

// 백그라운드 동기화 - 오프라인이 되면 큐에 데이터를 넣고 연결될 시 서버에 전송
// registration.sync.register() 를 통해 등록된 것은, 네트워크가 연결되지 않았을 때는 실행하지 않다가, 네트워크가 연결되면 백그라우드에서 실행한다.
// 네트워크 불안정 상태로 데이터가 전송되지 못했을 경우, 다시 네트워크가 정상(온라인)으로 돌아왔을 때 요청 전송 
// (연결이 없으면 사용자가 다시 연결되면 즉시 HTTP 요청이 대기 및 동기화)
/*
registration.sync.register('image-fetch').then(() => {
	console.log('[Service Worker] Sync registered');
});
*/
// https://ponyfoo.com/articles/backgroundsync
function backgroundSync() {
	console.log('[Service Worker] backgroundSync');
	fetch('/background-sync')
	.then(function(response) {
		return response;
	})
	.then(function(text) {
		console.log('[Service Worker] sync request successful', text);
	})
	.catch(function(error) {
		console.log('[Service Worker] sync request failed', error);
	});
}
function serverSyncTest1 () {
	console.log('[Service Worker] serverSyncTest1');

	self.registration.getNotifications()
	.then(function(notifications) {
		console.log('[Service Worker] getNotifications', notifications);
		if(Array.isArray(notifications) && notifications.length) {
			self.registration.showNotification("[Service Worker] sync test1");
		}
	});

	// fetch 요청 
	/*fetch('/markdowns', {
		method: 'POST',
		body: JSON.stringify({
			markdowns: 'test'
		}),
		headers: {
			'Content-Type': 'application/json'
		}
	})
	.then(function(response) {
		self.registration.showNotification("[Service Worker] markdowns test");
	});*/
	/*fetch('./test/pwa.html')
	.then(function(response) {
		return response;
	})
	.then(function(text) {
		console.log('[Service Worker] sync request successful', text);
	})
	.catch(function(error) {
		console.log('[Service Worker] sync request failed', error);
	});*/
}
function serverSyncTest2() {
	console.log('[Service Worker] serverSyncTest2');

	self.registration.getNotifications()
	.then(function(notifications) {
		console.log('[Service Worker] getNotifications', notifications);
		if(Array.isArray(notifications) && notifications.length) {
			self.registration.showNotification("[Service Worker] sync test2");
		}
	});

	return Promise.reject("fail"); // reject 사이트 에러상태
}
self.addEventListener('sync', function(event) {
	// sync 에 등록된 것에 대해, 
	// 네트워크가 연결되어있을 경우는 바로 실행하고
	// 네트워크가 불안정할 경우 대기하고 있다가 다시 정상적으로 연결되면 그때 실행한다.
	// 즉, registration.sync.register() 를 통해 등록된 백그라운드 sync 는 네트워크가 연결되었을 때 핸들러를 실행한다.
	console.log('[Service Worker] sync 이벤트 실행', event);

	// sendToServer
	switch(event.tag) { // event.tag 는 클라이언트에서 이벤트 설정 
		case 'background-sync':
			event.waitUntil(backgroundSync());
			break;
		case 'test1':
			event.waitUntil(serverSyncTest1());
			break;
		case 'test2':
			//event.waitUntil(serverSyncTest2());
			break;
	}
});

// ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- 

// Push 처리 - 푸시전용 서비스워커 파일을 따로 관리하는 것인 좋음 (서비스워커가 없데이트 되면, 사용자 푸시키도 업데이트 됨. 즉, 서비스워커 업데이트시 새로 푸시알림을 등록해야함)
// https://webpushdemo.azurewebsites.net/
// https://developer.mozilla.org/ko/docs/Web/API/notification
self.addEventListener('push', function(event) {
	console.log('[Service Worker Push] push 이벤트 실행', event);
	console.log(`[Service Worker Push] Push had this data: "${event.data.text()}"`); // es6 template

	var payload = event.data && event.data.text(); // 서버로 부터 받은 push data 
	var json = /^{.*}$/.test(payload) ? event.data.json() : {};
	var title = '';
	var options = {};
	
	// notification
	// https://developers.google.com/web/fundamentals/push-notifications/
	// https://developers.google.com/web/fundamentals/push-notifications/display-a-notification
	title = 'title' in json ? json.title : 'Push';
	options = {
		// Visual Options
		body: 'body' in json ? json.body : payload, // event.data.text();
		icon: 'icon' in json ? json.icon : '/image/mobile76x76.png', 
		image: 'image' in json ? json.image : '', 
		badge: 'badge' in json ? json.badge : '/image/mobile76x76.png', 
		vibrate: 'vibrate' in json && Array.isArray(json.vibrate) ? json.vibrate : [200, 100, 200, 100, 200, 100, 400], // window.navigator.vibrate([200, 100, 200]);
		sound: 'sound' in json ? json.sound : '', 
		//dir: "<String of 'auto' | 'ltr' | 'rtl'>", // 방향, 텍스트를 오른쪽에서 왼쪽으로 또는 왼쪽에서 오른쪽으로 표시 할 방향을 정의

		// Both visual & behavioral options
		/*actions: [ // 버튼을 표시하도록 정의
			{"action": "yes", "title": "Yes", "icon": "image/yes.png"},
			{"action": "no", "title": "No", "icon": "image/no.png"}
		],*/

		// Information Option. No visual affect.
		//timestamp: '<Long>', // 타임 스탬프를 사용하면 푸시 알림이 전송 된 이벤트가 발생한 시간을 플랫폼에 알릴 수 있습니다.

		// Behavioral Options
		//tag: 'pushTest', // 여러개의 푸시를 보낼 때, 푸시 순서를 구분하거나, 종류(내용) 등을 구분할 수 있도록 해주는 문구형태 활용 (만약에 알림이 같은 태그를 가졌는데 아직 표시 되기 전이라면, 새 알림은 이전의 알림을 대체하게 됩니다. 만약에 태그가 같고 이미 표시가 되었다면 이전 알림은 닫히고 새로운 알림이 표시 됩니다.)
		//requireInteraction: '<boolean>', // 자동으로 닫히지 않고 사용자가 클릭하거나 닫을 때까지 알림이 활성 상태로 유지
		//renotify: '<Boolean>', // 이전 알림을 교체 한 후 사용자에게 알림을 표시
		//silent: '<Boolean>', // 기기의 설정과 상관없이 소리가 없거나 진동이 울려야 한다는 등 알림이 조용해야 하는지
		data: 'params' in json && typeof json.params === 'object' ? json.params : {} // 사용자 정의 데이터 (사용자가 별도로 params 라는 값을 넣어서 보냄) - 알람에 특정 데이터 추가
	};

	// 사용자 푸시보기 권한이 승인된 상태여야 한다.
	event.waitUntil(self.registration.showNotification(title, options));
}); 
self.addEventListener('pushsubscriptionchange', function(event) {
	console.log('[Service Worker Push] pushsubscriptionchange 이벤트 실행', event);
	event.waitUntil(
		self.registration.pushManager.subscribe(e.oldSubscription.options)  
		.then(subscription => {  
		  // TODO: Send new subscription to application server  
		  console.log('[Service Worker Push] subscription', subscription);
		})
	); 
});

// 알림 관련 이벤트 
self.addEventListener('notificationclick', function(event) {
	console.log('[Service Worker Push] notificationclick 이벤트 실행', event);
	var url = 'http://makestory.net/media/#/view/456';
 
	/*
	-
	사용자 정의 데이터 위치: event.notification.data
	
	-
	알람 클릭 시 이미 열려있는 창에 집중시키기
	// new URL() : url이 products/10 이런식이면 http://products/10 와 같이 바꿔줍니다.
	var urlToOpen = new URL(examplePage, self.location.origin).href;

	var promiseChain = clients.matchAll({ // matchAll() 은 탭만 반환하고, 웹 워커는 제외합니다.
		type: 'window',
		includeUncontrolled: true // 현재 서비스워커 이외의 다른 서비스워커가 제어하는 탭들도 포함합니다. 그냥 default로 항상 넣어주세요.
	})
	.then((windowClients) => {
		// windowClients 는 현재 열린 탭들의 값입니다.
		var matchingClient = null;

		for (var i = 0; i < windowClients.length; i++) {
			var windowClient = windowClients[i];
			if (windowClient.url === urlToOpen) {
			matchingClient = windowClient;
			break;
			}
		}

		if (matchingClient) {
			return matchingClient.focus();
		} else {
			return clients.openWindow(urlToOpen);
		}
	});

	// promiseChain은 위 matchingClient.focus()의 실행이 끝난 후 waitUntil()을 수행하기 위한 프로미스 체인입니다.
	event.waitUntil(promiseChain);
	*/

	// 알림 닫기 
	event.notification.close();

	// 사용자 정의데이터 
	if(typeof event.notification === 'object' && event.notification && typeof event.notification.data === 'object' && event.notification.data && event.notification.data.url) {
		url = event.notification.data.url;
	}
	event.waitUntil(clients.openWindow(url));
}); 
self.addEventListener('notificationclose', function(event) {
	console.log('[Service Worker Push] notificationclose 이벤트 실행', event);
});

// ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- 
