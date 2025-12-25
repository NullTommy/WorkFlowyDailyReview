// 消息通信模块（popup 端）

/**
 * 向 background script 发送消息
 * @param {string} action - 操作类型
 * @param {*} payload - 消息负载
 * @returns {Promise<*>} 响应结果
 */
function sendMessage(action, payload) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action, payload }, response => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else if (response && response.error) {
                reject(new Error(response.error));
            } else {
                resolve(response);
            }
        });
    });
}

