// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const ALARM_NAME = 'WFReviewReminder';
const alarmSet = new Set();

function setReminder(interval, tip, userData) {
    const intervalMinutes = Number(userData?.userInterval ?? interval);
    if (!intervalMinutes || Number.isNaN(intervalMinutes)) {
        return Promise.reject(new Error('无效的提醒间隔'));
    }
    // Chrome 要求定时器最小间隔为 1 分钟
    if (intervalMinutes < 1) {
        return Promise.reject(new Error('提醒间隔不能小于 1 分钟'));
    }
    // interval 单位分钟
    const triggerTime = Date.now() + 60 * 1000 * intervalMinutes;
    return new Promise((resolve, reject) => {
        chrome.alarms.clearAll(() => {
            if (chrome.runtime.lastError) {
                return reject(new Error(chrome.runtime.lastError.message));
            }
            // 创建定时器并检查错误
            chrome.alarms.create(ALARM_NAME, { when: triggerTime, periodInMinutes: intervalMinutes }, () => {
                if (chrome.runtime.lastError) {
                    return reject(new Error(`创建定时器失败: ${chrome.runtime.lastError.message}`));
                }
                console.log(`定时器创建成功: ${ALARM_NAME}, 首次触发时间: ${new Date(triggerTime).toLocaleString()}, 间隔: ${intervalMinutes}分钟`);
                
                const dataToSave = {
                    interval: intervalMinutes,
                    tip,
                    userData: { ...userData, userInterval: intervalMinutes }
                };
                chrome.storage.local.set(dataToSave, () => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve();
                    }
                });
            });
        });
    });
}

function getReviewUrl(userData) {
    const defaultData = getDefaultData();
    const safeUserData = userData || transToUserData(defaultData);
    const base = safeUserData.userUrl !== '' ? `${safeUserData.userUrl}?q=` : defaultData.defaultQueryUrl;
    const since = 'last-changed-since:';
    const before = 'last-changed-before:';
    const tag = safeUserData.userTag !== '' ? safeUserData.userTag : defaultData.defaultTag;
    const blank = '%20';

    const nowTime = Date.now();
    const sourceDate = new Date('2021/07/01'); // 标签开始时间
    const sourceDateTime = sourceDate.getTime();
    const dayDiff = Math.round((nowTime - sourceDateTime) / (24 * 3600 * 1000));
    const ran = Math.ceil(Math.random() * dayDiff); // 生成 0-dayDiff 之间的数字

    const sinceDate = new Date();
    const beforeDate = new Date();
    sinceDate.setTime(nowTime - ran * 1000 * 60 * 60 * 24);
    beforeDate.setTime(nowTime - (ran - 2) * 1000 * 60 * 60 * 24);
    const sinceDateStr = sinceDate.format('MM/dd/yyyy');
    const beforeDateStr = beforeDate.format('MM/dd/yyyy');
    const endUrl = `${base}${since}${sinceDateStr}${blank}${before}${beforeDateStr}${blank}${tag}`;
    return endUrl;
}

function getAllAlarms() {
    return new Promise((resolve, reject) => {
        chrome.alarms.getAll(alarms => {
            if (chrome.runtime.lastError) {
                return reject(new Error(chrome.runtime.lastError.message));
            }
            const alarmTmpList = alarms.map(alarm => {
                const scheduledDate = new Date(alarm.scheduledTime);
                return {
                    name: alarm.name,
                    periodInMinutes: alarm.periodInMinutes,
                    scheduledTime: alarm.scheduledTime,
                    scheduledTimeStr: scheduledDate.format('MM/dd/yyyy hh:mm:ss')
                };
            });
            resolve(alarmTmpList);
        });
    });
}

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

function sendTest() {
    return fetch('https://api.day.app/test').then(res => res.text());
}

function sendLarkMsg(msgText) {
    const payload = {
        msg_type: 'text',
        content: {
            text: msgText
        }
    };
    return fetch('https://open.feishu.cn/open-apis/bot/v2/hook/6c89f9db-0ec0-4edd-a170-79b167389768', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        },
        body: JSON.stringify(payload)
    }).then(res => res.json());
}

function getUserStorageObj() {
    return {
        userUrl: '',
        userQueryUrl: '',
        userTag: '',
        userInterval: '',
        tip: ''
    };
}

function getDefaultData() {
    return {
        defaultUserUrl: 'https://workflowy.com/#',
        defaultQueryUrl: 'https://workflowy.com/#?q=',
        defaultTag: '@文档标题',
        defaultInterval: 240,
        defaultTip: '回顾一下 WorkFlowy 吧!链接已自动复制到剪贴板!'
    };
}

function transToUserData(defaultData) {
    const userData = getUserStorageObj();
    userData.userUrl = defaultData.defaultUserUrl;
    userData.userQueryUrl = defaultData.defaultQueryUrl;
    userData.userTag = defaultData.defaultTag;
    userData.userInterval = defaultData.defaultInterval;
    userData.tip = defaultData.defaultTip;
    return userData;
}

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

Date.prototype.format = function(fmt) {
    const o = {
        'M+': this.getMonth() + 1,
        'd+': this.getDate(),
        'h+': this.getHours(),
        'm+': this.getMinutes(),
        's+': this.getSeconds(),
        'q+': Math.floor((this.getMonth() + 3) / 3),
        S: this.getMilliseconds()
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (const k in o) {
        if (new RegExp('(' + k + ')').test(fmt)) {
            fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length));
        }
    }
    return fmt;
};

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

function handleAlarm(alarm) {
    if (alarm.name !== ALARM_NAME) {
        return;
    }
    
    // 使用时间戳作为去重标识，避免重复触发
    const alarmKey = `${alarm.name}_${alarm.scheduledTime}`;
    if (alarmSet.has(alarmKey)) {
        console.log('定时器已处理，跳过', alarmKey);
        return;
    }

    getStoredData()
        .then(result => {
            const userData = result.userData || transToUserData(getDefaultData());
            const tip = result.tip || '回顾一下 WorkFlowy 吧!链接已自动复制到剪贴板!';
            
            // 生成回顾链接
            const reviewUrl = getReviewUrl(userData);
            console.log('生成的回顾链接:', reviewUrl);
            
            // 将链接存储到临时存储中，以便通知点击时使用
            chrome.storage.local.set({ lastReviewUrl: reviewUrl }, () => {
                if (chrome.runtime.lastError) {
                    console.warn('存储链接失败:', chrome.runtime.lastError.message);
                }
            });
            
            // 尝试复制链接到剪贴板
            copyUrlToClipboard(reviewUrl);
            
            // 创建通知，使用正确的图标路径
            chrome.notifications.create({
                type: 'basic',
                iconUrl: chrome.runtime.getURL('icon.png'),
                title: 'WorkFlowy Review',
                message: tip,
                requireInteraction: true
            }, (notificationId) => {
                if (chrome.runtime.lastError) {
                    console.error('创建通知失败:', chrome.runtime.lastError.message);
                } else {
                    console.log('通知创建成功，ID:', notificationId);
                }
            });
        })
        .catch(err => console.error('读取存储失败', err));

    // 记录已处理的定时器，防止重复触发
    alarmSet.add(alarmKey);
    // 清理旧的记录（保留最近10条）
    if (alarmSet.size > 10) {
        const entries = Array.from(alarmSet);
        alarmSet.clear();
        entries.slice(-5).forEach(key => alarmSet.add(key));
    }
    console.log('*******Got an alarm!*********', alarm);
}

chrome.alarms.onAlarm.addListener(handleAlarm);

// 处理通知点击事件
chrome.notifications.onClicked.addListener((notificationId) => {
    console.log('通知被点击:', notificationId);
    // 获取存储的链接并打开
    chrome.storage.local.get(['lastReviewUrl'], (result) => {
        if (chrome.runtime.lastError) {
            console.error('读取链接失败:', chrome.runtime.lastError.message);
            // 如果读取失败，重新生成链接
            getStoredData()
                .then(stored => {
                    const userData = stored.userData || transToUserData(getDefaultData());
                    const reviewUrl = getReviewUrl(userData);
                    chrome.tabs.create({ url: reviewUrl });
                })
                .catch(err => console.error('生成链接失败', err));
        } else if (result.lastReviewUrl) {
            chrome.tabs.create({ url: result.lastReviewUrl });
        } else {
            // 如果没有存储的链接，重新生成
            getStoredData()
                .then(stored => {
                    const userData = stored.userData || transToUserData(getDefaultData());
                    const reviewUrl = getReviewUrl(userData);
                    chrome.tabs.create({ url: reviewUrl });
                })
                .catch(err => console.error('生成链接失败', err));
        }
    });
    // 关闭通知
    chrome.notifications.clear(notificationId);
});

chrome.runtime.onInstalled.addListener(() => {
    const userData = transToUserData(getDefaultData());
    setReminder(userData.userInterval, userData.tip, userData).catch(err => {
        console.error('初始化提醒失败', err);
    });
});

chrome.runtime.onStartup.addListener(() => {
    const userDefaultData = transToUserData(getDefaultData());
    getStoredData()
        .then(result => {
            if (result.userData) {
                return setReminder(result.userData.userInterval, result.userData.tip, result.userData);
            }
            return setReminder(userDefaultData.userInterval, userDefaultData.tip, userDefaultData);
        })
        .catch(err => console.error('启动时设置提醒失败', err));
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || !message.action) {
        sendResponse({ error: 'invalid_message' });
        return;
    }

    const done = Promise.resolve()
        .then(() => {
            switch (message.action) {
                case 'getReviewUrl':
                    return { url: getReviewUrl(message.payload) };
                case 'setReminder':
                    return setReminder(message.payload.userInterval, message.payload.tip, message.payload).then(() => ({ ok: true }));
                case 'getStoredData':
                    return getStoredData();
                case 'sendTest':
                    return sendTest().then(result => ({ result }));
                case 'sendLarkMsg':
                    return sendLarkMsg(message.payload).then(result => ({ result }));
                case 'getAllAlarms':
                    return getAllAlarmsWrapper();
                case 'getDefaultData':
                    return { data: getDefaultData() };
                case 'transToUserData':
                    return { data: transToUserData(getDefaultData()) };
                case 'buildUserStorageData':
                    return buildUserStorageData(message.payload);
                default:
                    throw new Error('unknown_action');
            }
        })
        .then(response => sendResponse(response))
        .catch(err => sendResponse({ error: err.message }));

    // 保持消息通道打开
    if (done && typeof done.then === 'function') {
        return true;
    }
});

function getAllAlarmsWrapper() {
    return getAllAlarms().then(alarms => ({ alarms }));
}
