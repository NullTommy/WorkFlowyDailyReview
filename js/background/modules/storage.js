// 数据存储模块（background 端）
// 注意：此模块依赖 common/modules/storage.js

/**
 * 从 chrome.storage 读取用户数据
 * @returns {Promise<Object>} 包含 tip 和 userData 的对象
 */
function getStoredData() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['tip', 'userData'], result => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(result);
            }
        });
    });
}

/**
 * 构建用户存储数据，合并存储的数据与传入的数据
 * @param {Object} userData - 传入的用户数据
 * @returns {Promise<Object>} 合并后的用户数据
 */
function buildUserStorageData(userData) {
    return getStoredData().then(result => {
        const cloned = { ...userData };
        if (result.userData) {
            cloned.userUrl = result.userData.userUrl;
            cloned.userTag = result.userData.userTag;
            cloned.userInterval = result.userData.userInterval;
        }
        if (result.tip) {
            cloned.tip = result.tip;
        }
        return cloned;
    });
}
