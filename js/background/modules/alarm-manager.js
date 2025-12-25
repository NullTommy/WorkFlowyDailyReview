// 定时器管理模块

const ALARM_NAME = 'WFReviewReminder';
const alarmSet = new Set();

/**
 * 设置提醒定时器
 * @param {number} interval - 提醒间隔（分钟）
 * @param {string} tip - 提醒提示文本
 * @param {Object} userData - 用户数据对象
 * @returns {Promise<void>}
 */
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

/**
 * 获取所有定时器信息
 * @returns {Promise<Array>} 定时器信息数组
 */
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

/**
 * 获取所有定时器的包装函数
 * @returns {Promise<Object>} 包含 alarms 数组的对象
 */
function getAllAlarmsWrapper() {
    return getAllAlarms().then(alarms => ({ alarms }));
}

/**
 * 处理定时器触发事件
 * @param {chrome.alarms.Alarm} alarm - 定时器对象
 */
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

