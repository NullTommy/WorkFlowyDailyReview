// 表单处理模块（popup 端）

/**
 * 从页面表单获取用户输入的数据
 * @returns {Object} 用户数据对象
 */
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

/**
 * 加载用户保存的数据并填充到表单中
 * 进入 popup 页面时触发
 */
function reloadUserData() {
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

