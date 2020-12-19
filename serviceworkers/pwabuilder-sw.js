// https://docs.microsoft.com/en-us/microsoft-edge/progressive-web-apps-edgehtml/get-started

// Respond to a server push with a user notification
self.addEventListener('push', function (event) {
	if ("granted" === Notification.permission) {
		var payload = event.data ? event.data.text() : 'no payload';
		const promiseChain = self.registration.showNotification('Sample PWA', {
			body: payload,
			icon: 'images/windows10/Square44x44Logo.scale-100.png'
		});
		//Ensure the toast notification is displayed before exiting this function
		event.waitUntil(promiseChain);
	}
});
	
// Respond to the user clicking the toast notification
self.addEventListener('notificationclick', function (event) {
	console.log('On notification click: ', event.notification.tag);
	event.notification.close();
	
	// This looks to see if the current is already open and focuses it
	event.waitUntil(clients.matchAll({
		type: 'window'
	}).then(function (clientList) {
		for (var i = 0; i < clientList.length; i++) {
			var client = clientList[i];
			if (client.url == 'http://localhost:1337/' && 'focus' in client)
				return client.focus();
		}
		if (clients.openWindow)
			return clients.openWindow('/');
	}));
});