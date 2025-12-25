// 消息发送模块

/**
 * 发送测试请求
 * @returns {Promise<string>} 响应文本
 */
function sendTest() {
    return fetch('https://api.day.app/test').then(res => res.text());
}

/**
 * 发送飞书消息
 * @param {string} msgText - 消息文本
 * @returns {Promise<Object>} 响应对象
 */
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

