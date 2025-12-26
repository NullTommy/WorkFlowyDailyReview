// URL 生成模块

/**
 * 生成 WorkFlowy 回顾链接
 * 基于随机日期范围生成历史回顾查询链接
 * @param {Object} userData - 用户数据对象
 * @returns {string} 生成的回顾链接
 */
function getReviewUrl(userData) {
    return getReviewUrlV1(userData);
}

/**
 * 生成 WorkFlowy 回顾链接 V1
 * 基于随机日期范围生成历史回顾查询链接
 * @param {Object} userData - 用户数据对象
 * @returns {string} 生成的回顾链接
 */
function getReviewUrlV1(userData) {
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
    const queryParams = `${since}${sinceDateStr}${blank}${before}${beforeDateStr}${blank}${tag}`;
    const endUrl = `${base}${queryParams}`;
    return endUrl;
}

/**
 * 生成 WorkFlowy 回顾链接 V2
 * 基于随机日期范围生成历史回顾查询链接
 * @param {Object} userData - 用户数据对象
 * @returns {string} 生成的回顾链接
 */
function getReviewUrlV2(userData) {
    const defaultData = getDefaultData();
    const safeUserData = userData || transToUserData(defaultData);
    const base = safeUserData.userUrl !== '' ? `${safeUserData.userUrl}?q=` : defaultData.defaultQueryUrl;
    const tag = safeUserData.userTag !== '' ? safeUserData.userTag : defaultData.defaultTag;
    const blank = '%20';

    const nowTime = Date.now();
    const sourceDate = new Date('2021/07/01'); // 标签开始时间
    const sourceDateTime = sourceDate.getTime();
    const dayDiff = Math.round((nowTime - sourceDateTime) / (24 * 3600 * 1000));
    const ran = Math.ceil(Math.random() * dayDiff); // 生成 0-dayDiff 之间的数字

    // 计算天数差：ran 天前到今天，ran-2 天前到今天
    const daysSince = ran;
    const daysBefore = ran - 2;
    
    const queryParams = `changed:${daysSince}d${blank}-changed:${daysBefore}d${blank}${tag}`;
    const endUrl = `${base}${queryParams}`;
    return endUrl;
}


/**
 * 生成 WorkFlowy 回顾链接（N年前今天）
 * 基于指定年数前的今天日期生成历史回顾查询链接
 * @param {Object} userData - 用户数据对象
 * @param {number} yearsAgo - 多少年前，默认为1（去年）。例如：1=去年，2=前年，3=3年前
 * @returns {string} 生成的回顾链接
 */
function getLastNYearsAgoReviewUrl(userData, yearsAgo) {
    return getLastNYearsAgoReviewUrlV1(userData, yearsAgo);
}


/**
 * 生成 WorkFlowy 回顾链接（N年前今天）V1
 * 基于指定年数前的今天日期生成历史回顾查询链接
 * @param {Object} userData - 用户数据对象
 * @param {number} yearsAgo - 多少年前，默认为1（去年）。例如：1=去年，2=前年，3=3年前
 * @returns {string} 生成的回顾链接
 */
function getLastNYearsAgoReviewUrlV1(userData, yearsAgo) {
    const defaultData = getDefaultData();
    const safeUserData = userData || transToUserData(defaultData);
    const base = safeUserData.userUrl !== '' ? `${safeUserData.userUrl}?q=` : defaultData.defaultQueryUrl;
    const since = 'last-changed-since:';
    const before = 'last-changed-before:';
    const tag = safeUserData.userTag !== '' ? safeUserData.userTag : defaultData.defaultTag;
    const blank = '%20';

    // 参数验证和默认值处理
    const yearOffset = typeof yearsAgo === 'number' && yearsAgo > 0 ? yearsAgo : 1;
    
    // 计算N年前今天的日期
    const targetYearToday = new Date();
    targetYearToday.setFullYear(targetYearToday.getFullYear() - yearOffset);
    
    const sinceDate = new Date(targetYearToday);
    const beforeDate = new Date(targetYearToday);
    // sinceDate 设置为N年前今天的前2天（更早的日期）
    sinceDate.setTime(sinceDate.getTime() - 2 * 1000 * 60 * 60 * 24);
    
    const sinceDateStr = sinceDate.format('MM/dd/yyyy');
    const beforeDateStr = beforeDate.format('MM/dd/yyyy');
    const queryParams = `${since}${sinceDateStr}${blank}${before}${beforeDateStr}${blank}${tag}`;
    const endUrl = `${base}${queryParams}`;
    return endUrl;
}

/**
 * 生成 WorkFlowy 回顾链接（N年前今天）V2
 * 基于指定年数前的今天日期生成历史回顾查询链接
 * @param {Object} userData - 用户数据对象
 * @param {number} yearsAgo - 多少年前，默认为1（去年）。例如：1=去年，2=前年，3=3年前
 * @returns {string} 生成的回顾链接
 */
function getLastNYearsAgoReviewUrlV2(userData, yearsAgo) {
    const defaultData = getDefaultData();
    const safeUserData = userData || transToUserData(defaultData);
    const base = safeUserData.userUrl !== '' ? `${safeUserData.userUrl}?q=` : defaultData.defaultQueryUrl;
    const tag = safeUserData.userTag !== '' ? safeUserData.userTag : defaultData.defaultTag;
    const blank = '%20';

    // 参数验证和默认值处理
    const yearOffset = typeof yearsAgo === 'number' && yearsAgo > 0 ? yearsAgo : 1;
    
    const nowTime = Date.now();
    
    // 计算N年前今天的日期
    const targetYearToday = new Date();
    targetYearToday.setFullYear(targetYearToday.getFullYear() - yearOffset);
    
    const sinceDate = new Date(targetYearToday);
    // sinceDate 设置为N年前今天的前2天（更早的日期）
    sinceDate.setTime(sinceDate.getTime() - 2 * 1000 * 60 * 60 * 24);
    
    // 计算从 sinceDate 到今天的天数差
    const daysSince = Math.round((nowTime - sinceDate.getTime()) / (24 * 3600 * 1000));
    // 计算从 targetYearToday 到今天的天数差
    const daysBefore = Math.round((nowTime - targetYearToday.getTime()) / (24 * 3600 * 1000));
    
    const queryParams = `changed:${daysSince}d${blank}-changed:${daysBefore}d${blank}${tag}`;
    const endUrl = `${base}${queryParams}`;
    return endUrl;
}



