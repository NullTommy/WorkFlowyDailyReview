// Popup 页面事件处理模块
// 注意：此文件依赖于 popup/modules/ 下的模块文件
// 模块加载顺序：storage.js -> messaging.js -> clipboard.js -> form-handler.js

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

/*加载用户保存的数据-进入pop页面时触发*/
reloadUserData();
