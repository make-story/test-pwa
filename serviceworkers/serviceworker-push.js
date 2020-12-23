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
		badge: 'badge' in json ? json.badge : '/image/login-logo.png', 
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