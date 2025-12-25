// 数据处理模块

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

