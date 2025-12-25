// URL 生成模块

/**
 * 生成 WorkFlowy 回顾链接
 * 基于随机日期范围生成历史回顾查询链接
 * @param {Object} userData - 用户数据对象
 * @returns {string} 生成的回顾链接
 */
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

