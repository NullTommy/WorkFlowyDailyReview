// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

// 按依赖顺序加载模块
// 1. 日期工具（无依赖）
importScripts('background/modules/date-utils.js');
// 2. 共享数据存储（无依赖，但被其他模块使用）
importScripts('common/modules/storage.js');
// 3. Background 端数据存储（依赖共享存储）
importScripts('background/modules/storage.js');
// 4. URL 生成（依赖 storage）
importScripts('background/modules/url-generator.js');
// 5. 剪贴板操作（无依赖）
importScripts('background/modules/clipboard.js');
// 6. 定时器管理（依赖 storage, url-generator, clipboard）
importScripts('background/modules/alarm-manager.js');

// 定时器事件监听
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

// 扩展安装时初始化
chrome.runtime.onInstalled.addListener(() => {
    const userData = transToUserData(getDefaultData());
    setReminder(userData.userInterval, userData.tip, userData).catch(err => {
        console.error('初始化提醒失败', err);
    });
});

// 浏览器启动时恢复定时器
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

// 处理来自 popup 或其他脚本的消息
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

    // 保持消息通道打开（用于异步响应）
    if (done && typeof done.then === 'function') {
        return true;
    }
});
