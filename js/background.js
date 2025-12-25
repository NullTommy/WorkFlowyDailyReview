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
    // interval 单位分钟
    const triggerTime = Date.now() + 60 * 1000 * intervalMinutes;
    return new Promise((resolve, reject) => {
        chrome.alarms.clearAll(() => {
            if (chrome.runtime.lastError) {
                return reject(new Error(chrome.runtime.lastError.message));
            }
            chrome.alarms.create(ALARM_NAME, { when: triggerTime, periodInMinutes: intervalMinutes });
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

function handleAlarm(alarm) {
    if (alarm.name !== ALARM_NAME) {
        return;
    }
    if (alarmSet.has(alarm.scheduledTime)) {
        return;
    }

    getStoredData()
        .then(result => {
            const userData = result.userData || transToUserData(getDefaultData());
            if (result.tip) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icon.png',
                    title: 'WorkFlowy Review',
                    message: result.tip,
                    requireInteraction: true
                });
            }
            getReviewUrl(userData);
        })
        .catch(err => console.error('读取存储失败', err));

    alarmSet.clear();
    alarmSet.add(alarm.scheduledTime);
    console.log('*******Got an alarm!*********', alarm);
}

chrome.alarms.onAlarm.addListener(handleAlarm);

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
