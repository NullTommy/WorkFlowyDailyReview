// 剪贴板操作模块

/**
 * 通过 content script 将链接复制到剪贴板
 * @param {string} url - 要复制的链接
 */
function copyUrlToClipboard(url) {
    // 尝试在所有标签页中执行复制操作
    chrome.tabs.query({}, (tabs) => {
        if (chrome.runtime.lastError) {
            console.error('查询标签页失败:', chrome.runtime.lastError.message);
            return;
        }
        
        let copySuccess = false;
        let pendingTabs = tabs.length;
        
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { action: 'copyToClipboard', text: url }, (response) => {
                pendingTabs--;
                if (!chrome.runtime.lastError && response && response.success) {
                    copySuccess = true;
                    console.log('链接已复制到剪贴板:', url);
                }
                
                // 如果所有标签页都处理完毕且没有成功，记录错误
                if (pendingTabs === 0 && !copySuccess) {
                    console.warn('无法复制链接到剪贴板（可能没有活动的标签页）');
                }
            });
        });
        
        // 如果没有标签页，尝试使用 scripting API（需要 activeTab 权限）
        if (tabs.length === 0) {
            console.warn('没有活动的标签页，无法复制链接');
        }
    });
}

