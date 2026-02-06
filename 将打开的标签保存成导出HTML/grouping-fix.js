// 按规则分组功能
document.getElementById('groupByRulesButton').addEventListener('click', async () => {
    try {
        const button = document.getElementById('groupByRulesButton');
        const originalHTML = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '正在分组...';
        
        // 获取保存的规则
        const result = await chrome.storage.sync.get(['tabGroupingRules']);
        const rules = result.tabGroupingRules || [];
        
        if (rules.length === 0) {
            alert('还没有设置分组规则！\n请先点击"分组设置"按钮添加规则。');
            button.innerHTML = originalHTML;
            button.disabled = false;
            return;
        }
        
        // 获取当前窗口的所有标签
        const currentWindow = await chrome.windows.getCurrent();
        const tabs = await chrome.tabs.query({ windowId: currentWindow.id });
        
        // 用于匹配URL的函数
        function matchPattern(url, pattern) {
            try {
                // 将通配符模式转换为正则表达式
                let regexPattern = pattern;
                
                // 转义正则表达式特殊字符
                regexPattern = regexPattern.replace(/\./g, '\\.');
                regexPattern = regexPattern.replace(/\+/g, '\\+');
                regexPattern = regexPattern.replace(/\?/g, '\\?');
                regexPattern = regexPattern.replace(/\^/g, '\\^');
                regexPattern = regexPattern.replace(/\$/g, '\\$');
                regexPattern = regexPattern.replace(/\{/g, '\\{');
                regexPattern = regexPattern.replace(/\}/g, '\\}');
                regexPattern = regexPattern.replace(/\(/g, '\\(');
                regexPattern = regexPattern.replace(/\)/g, '\\)');
                regexPattern = regexPattern.replace(/\|/g, '\\|');
                regexPattern = regexPattern.replace(/\[/g, '\\[');
                regexPattern = regexPattern.replace(/\]/g, '\\]');
                regexPattern = regexPattern.replace(/\\/g, '\\\\');
                
                // 将 * 转换为 .*
                regexPattern = regexPattern.replace(/\*/g, '.*');
                
                const regex = new RegExp('^' + regexPattern + '$', 'i');
                return regex.test(url);
            } catch (e) {
                console.error('Pattern match error:', e, 'Pattern:', pattern);
                return false;
            }
        }
        
        // 为每个规则创建分组
        let groupedCount = 0;
        
        for (const rule of rules) {
            const matchedTabs = [];
            
            // 找到匹配该规则的所有标签
            for (const tab of tabs) {
                // 检查标签是否已经在组中
                if (tab.groupId !== -1) continue;
                
                // 检查是否匹配任一模式
                const isMatch = rule.patterns.some(pattern => 
                    matchPattern(tab.url, pattern)
                );
                
                if (isMatch) {
                    matchedTabs.push(tab);
                }
            }
            
            // 如果有匹配的标签，创建分组
            if (matchedTabs.length > 0) {
                const tabIds = matchedTabs.map(tab => tab.id);
                const groupId = await chrome.tabs.group({ tabIds: tabIds });
                
                await chrome.tabGroups.update(groupId, {
                    title: `${rule.name}_${matchedTabs.length}`,
                    color: rule.color || 'grey',
                    collapsed: false
                });
                
                groupedCount += matchedTabs.length;
            }
        }
        
        // 刷新显示
        await updateStats();
        
        // 显示成功消息
        if (groupedCount > 0) {
            button.innerHTML = `✓ 已分组 ${groupedCount} 个标签`;
        } else {
            button.innerHTML = '✓ 没有匹配的标签';
        }
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('Error grouping by rules:', error);
        alert('按规则分组时出错: ' + error.message);
        
        const button = document.getElementById('groupByRulesButton');
        button.disabled = false;
        button.innerHTML = originalHTML;
    }
});
