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

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        const result = document.execCommand('copy');
        document.body.removeChild(input);
        if (result) {
            resolve();
        } else {
            reject(new Error('复制失败'));
        }
    });
}

/* 【按钮】【获取历史回顾URL】生成并复制URL */
$('#get_url_btn').click(() => {
    const pageData = getPageData();
    sendMessage('getReviewUrl', pageData)
        .then(res => {
            const endUrl = res.url;
            $('#input_result').val(endUrl);
            return copyToClipboard(endUrl).then(() => {
                $('#span_copy_result').text('链接自动复制成功!');
            }).catch(() => {
                $('#span_copy_result').text('已生成链接，复制失败，请手动复制');
            });
        })
        .catch(err => alert(`生成链接失败：${err.message}`));
});

/* 【按钮】【测试成功即可设置用户数据】保存设置数据 */
$('#set_user_data_btn').click(() => {
    const pageData = getPageData();
    sendMessage('setReminder', pageData)
        .then(() => alert('用户设置已保存'))
        .catch(err => alert(`保存失败：${err.message}`));
});

/* 【按钮】【获取已保存的数据】加载保存的设置数据 */
$('#get_store_data_btn').click(() => {
    sendMessage('getStoredData')
        .then(result => {
            let dataStr = '数据:';
            if (result.tip) {
                dataStr += result.tip;
            }
            dataStr += '\n';
            if (result.userData) {
                dataStr += JSON.stringify(result.userData);
            }
            alert(dataStr);
        })
        .catch(err => alert(`读取失败：${err.message}`));
});

/*【按钮】【执行请求】执行请求按钮点击事件*/
$('#click_ajax_btn').click(() => {
    sendMessage('sendTest')
        .then(res => alert(`请求成功: ${res.result}`))
        .catch(err => alert(`请求失败：${err.message}`));
});

/*【按钮】【执行请求】飞书处理*/
$('#click_ajax_lark_btn').click(() => {
    const pageData = getPageData();
    sendMessage('getReviewUrl', pageData)
        .then(res => {
            const endUrl = res.url;
            $('#input_result').val(endUrl);
            return copyToClipboard(endUrl).catch(() => {});
        })
        .then(() => sendMessage('sendLarkMsg', $('#input_result').val()))
        .then(res => alert(`发送结果：${JSON.stringify(res.result)}`))
        .catch(err => alert(`发送失败：${err.message}`));
});

/*【按钮】【查看定时器】*/
$('#show_alarms_btn').click(() => {
    sendMessage('getAllAlarms')
        .then(res => alert(JSON.stringify(res.alarms)))
        .catch(err => alert(`获取定时器失败：${err.message}`));
});

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
    return {
        userUrl: defaultData.defaultUserUrl,
        userQueryUrl: defaultData.defaultQueryUrl,
        userTag: defaultData.defaultTag,
        userInterval: defaultData.defaultInterval,
        tip: defaultData.defaultTip
    };
}

function getPageData() {
    const defaultData = getDefaultData();
    const userPageData = transToUserData(defaultData);
    const userUrl = $('#input_baseUrl').val();
    if (userUrl !== '') {
        userPageData.userUrl = userUrl;
    }
    const userTag = $('#input_tag').val();
    if (userTag !== '') {
        userPageData.userTag = userTag;
    }
    const userInterval = $('#input_interval').val();
    if (userInterval !== '') {
        userPageData.userInterval = parseInt(userInterval, 10);
    }
    return userPageData;
}

function reloadUserData() {
    /*【异步】加载用户保存的数据-进入pop页面时触发*/
    chrome.storage.local.get(['tip', 'userData'], result => {
        if (result.userData) {
            const inputBaseUrl = document.getElementById('input_baseUrl');
            const inputTag = document.getElementById('input_tag');
            const inputInterval = document.getElementById('input_interval');
            inputBaseUrl.value = result.userData.userUrl;
            inputTag.value = result.userData.userTag;
            inputInterval.value = result.userData.userInterval;
            // 每次加载页面时自动生成链接
            $('#get_url_btn').click();
        }
    });
}

/*加载用户保存的数据-进入pop页面时触发*/
reloadUserData();
