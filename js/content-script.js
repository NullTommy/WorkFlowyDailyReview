(function() {
	// console.log('这是 simple-chrome-plugin-demo 的content-script！');
	
	// 监听来自 background 的消息，执行复制操作
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (message.action === 'copyToClipboard') {
			const text = message.text;
			copyToClipboard(text)
				.then(() => {
					console.log('链接已复制到剪贴板:', text);
					sendResponse({ success: true });
				})
				.catch(err => {
					console.error('复制失败:', err);
					sendResponse({ success: false, error: err.message });
				});
			return true; // 保持消息通道打开
		}
	});
	
	function copyToClipboard(text) {
		if (navigator.clipboard && navigator.clipboard.writeText) {
			return navigator.clipboard.writeText(text);
		}
		return new Promise((resolve, reject) => {
			const input = document.createElement('input');
			input.value = text;
			input.style.position = 'fixed';
			input.style.opacity = '0';
			input.style.pointerEvents = 'none';
			document.body.appendChild(input);
			input.select();
			input.setSelectionRange(0, 99999); // 兼容移动设备
			const result = document.execCommand('copy');
			document.body.removeChild(input);
			if (result) {
				resolve();
			} else {
				reject(new Error('复制失败'));
			}
		});
	}
})();
