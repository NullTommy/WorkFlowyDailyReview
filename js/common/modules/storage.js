// 共享数据存储模块
// 此模块包含 background 和 popup 共用的存储相关函数

/**
 * 获取用户存储对象结构模板
 * @returns {Object} 用户数据对象模板
 */
function getUserStorageObj() {
    return {
        userUrl: '',
        userQueryUrl: '',
        userTag: '',
        userInterval: '',
        tip: ''
    };
}

/**
 * 获取默认配置数据
 * @returns {Object} 默认配置对象
 */
function getDefaultData() {
    return {
        defaultUserUrl: 'https://workflowy.com/#',
        defaultQueryUrl: 'https://workflowy.com/#?q=',
        defaultTag: '',
        defaultInterval: 240, // 统一使用 240 分钟（4小时）
        defaultTip: '回顾去年今日的 WorkFlowy 吧! 点击通知可直接跳转!'
    };
}

/**
 * 将默认数据转换为用户数据格式
 * @param {Object} defaultData - 默认数据对象
 * @returns {Object} 用户数据对象
 */
function transToUserData(defaultData) {
    const userData = getUserStorageObj();
    userData.userUrl = defaultData.defaultUserUrl;
    userData.userQueryUrl = defaultData.defaultQueryUrl;
    userData.userTag = defaultData.defaultTag;
    userData.userInterval = defaultData.defaultInterval;
    userData.tip = defaultData.defaultTip;
    return userData;
}

