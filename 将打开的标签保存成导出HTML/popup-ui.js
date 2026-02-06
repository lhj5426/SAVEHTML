// Update stats immediately when popup opens
async function updateStats() {
    try {
        const windows = await chrome.windows.getAll();
        const tabs = await chrome.tabs.query({});
        
        // Get tab groups
        const groups = await chrome.tabGroups.query({});
        
        // Calculate domain groups
        const domainGroups = {};
        tabs.forEach(tab => {
            try {
                const hostname = new URL(tab.url).hostname.replace('www.', '');
                const parts = hostname.split('.');
                const domain = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
                domainGroups[domain] = (domainGroups[domain] || 0) + 1;
            } catch (e) {
                // Skip invalid URLs
            }
        });
        const domainCount = Object.keys(domainGroups).length;
        
        document.getElementById('windowCount').textContent = windows.length;
        document.getElementById('tabCount').textContent = tabs.length;
        document.getElementById('groupCount').textContent = groups.length;
        document.getElementById('domainCount').textContent = domainCount;
        
        // Display detailed group information
        const groupDetails = document.getElementById('groupDetails');
        
        // Show both tab groups and domain groups
        let detailsHTML = '';
        
        // Tab Groups Section
        if (groups.length > 0) {
            // Count tabs in each group
            const groupTabCounts = {};
            tabs.forEach(tab => {
                if (tab.groupId && tab.groupId !== -1) {
                    groupTabCounts[tab.groupId] = (groupTabCounts[tab.groupId] || 0) + 1;
                }
            });
            
            // Color mapping
            const colorMap = {
                'grey': '#5F6368',
                'blue': '#1A73E8',
                'red': '#D93025',
                'yellow': '#F9AB00',
                'green': '#1E8E3E',
                'pink': '#D01884',
                'purple': '#9334E6',
                'cyan': '#12B5CB',
                'orange': '#FA903E'
            };
            
            detailsHTML += '<div style="margin-bottom: 12px;"><strong style="color: #1976D2;">📑 标签组:</strong></div>';
            detailsHTML += groups.map(group => {
                const tabCount = groupTabCounts[group.id] || 0;
                const groupTitle = group.title || `未命名组`;
                const groupColor = colorMap[group.color] || colorMap['grey'];
                
                return `
                    <div class="group-detail-item">
                        <span class="group-color-dot" style="background-color: ${groupColor}"></span>
                        <span class="group-detail-name">${groupTitle}</span>
                        <span class="group-detail-count">${tabCount}个标签</span>
                    </div>
                `;
            }).join('');
        }
        
        // Domain Groups Section
        if (domainCount > 0) {
            // Sort domains by tab count (descending)
            const sortedDomains = Object.entries(domainGroups)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10); // Show top 10 domains
            
            detailsHTML += '<div style="margin-top: 12px; margin-bottom: 8px;"><strong style="color: #1976D2;">🌐 域名分组 (前10):</strong></div>';
            detailsHTML += sortedDomains.map(([domain, count]) => {
                return `
                    <div class="group-detail-item">
                        <span class="group-color-dot" style="background-color: #4CAF50"></span>
                        <span class="group-detail-name">${domain}</span>
                        <span class="group-detail-count">${count}个标签</span>
                    </div>
                `;
            }).join('');
        }
        
        if (detailsHTML) {
            groupDetails.innerHTML = detailsHTML;
            groupDetails.style.display = 'block';
        } else {
            groupDetails.style.display = 'none';
        }
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Update group names with tab counts
document.getElementById('updateGroupNamesButton').addEventListener('click', async () => {
    try {
        const groups = await chrome.tabGroups.query({});
        const tabs = await chrome.tabs.query({});
        
        // Count tabs in each group
        const groupTabCounts = {};
        tabs.forEach(tab => {
            if (tab.groupId && tab.groupId !== -1) {
                groupTabCounts[tab.groupId] = (groupTabCounts[tab.groupId] || 0) + 1;
            }
        });
        
        // Update each group's title
        for (const group of groups) {
            const tabCount = groupTabCounts[group.id] || 0;
            let currentTitle = group.title || '未命名组';
            
            // Remove existing number suffix if present (e.g., "在下载_22" -> "在下载")
            currentTitle = currentTitle.replace(/_\d+$/, '');
            
            // Add new count at the end
            const newTitle = `${currentTitle}_${tabCount}`;
            
            await chrome.tabGroups.update(group.id, { title: newTitle });
        }
        
        // Refresh the display
        await updateStats();
        
        // Show success message briefly
        const button = document.getElementById('updateGroupNamesButton');
        const originalText = button.innerHTML;
        button.innerHTML = '✓ 已更新';
        setTimeout(() => {
            button.innerHTML = originalText;
        }, 2000);
        
    } catch (error) {
        console.error('Error updating group names:', error);
        alert('更新标签组名称时出错: ' + error.message);
    }
});

// Group tabs by domain
document.getElementById('groupByDomainButton').addEventListener('click', async () => {
    try {
        const button = document.getElementById('groupByDomainButton');
        const originalHTML = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '正在分组...';
        
        // Get all tabs in current window
        const currentWindow = await chrome.windows.getCurrent();
        const tabs = await chrome.tabs.query({ windowId: currentWindow.id });
        
        // Helper function to get domain from URL
        function getDomain(url) {
            try {
                const hostname = new URL(url).hostname.replace('www.', '');
                const parts = hostname.split('.');
                return parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
            } catch (e) {
                return 'other';
            }
        }
        
        // Group tabs by domain
        const domainMap = {};
        tabs.forEach(tab => {
            const domain = getDomain(tab.url);
            if (!domainMap[domain]) {
                domainMap[domain] = [];
            }
            domainMap[domain].push(tab);
        });
        
        // Color palette for groups
        const colors = ['blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange', 'grey'];
        let colorIndex = 0;
        
        // Create groups for each domain
        for (const [domain, domainTabs] of Object.entries(domainMap)) {
            if (domainTabs.length > 1) { // Only group if there are multiple tabs
                // Get tab IDs
                const tabIds = domainTabs.map(tab => tab.id);
                
                // Create a new group
                const groupId = await chrome.tabs.group({ tabIds: tabIds });
                
                // Update group properties
                await chrome.tabGroups.update(groupId, {
                    title: `${domain}_${domainTabs.length}`,
                    color: colors[colorIndex % colors.length],
                    collapsed: false
                });
                
                colorIndex++;
            }
        }
        
        // Refresh the display
        await updateStats();
        
        // Show success message
        button.innerHTML = '✓ 分组完成';
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('Error grouping by domain:', error);
        alert('按域名分组时出错: ' + error.message);
        
        const button = document.getElementById('groupByDomainButton');
        button.disabled = false;
        button.innerHTML = originalHTML;
    }
});

// Initialize when popup opens
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
});



// 按规则分组功能
document.getElementById('groupByRulesButton').addEventListener('click', async () => {
    console.log('=== 按规则分组按钮被点击 ===');
    try {
        const button = document.getElementById('groupByRulesButton');
        const originalHTML = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '正在分组...';
        
        console.log('开始获取规则...');
        // 获取保存的规则
        const result = await chrome.storage.sync.get(['tabGroupingRules']);
        const rules = result.tabGroupingRules || [];
        
        console.log('获取到的规则:', rules);
        console.log('规则数量:', rules.length);
        
        if (rules.length === 0) {
            console.log('没有规则，显示提示');
            alert('还没有设置分组规则！\n请先点击"分组设置"按钮添加规则。');
            button.innerHTML = originalHTML;
            button.disabled = false;
            return;
        }
        
        console.log('开始获取标签...');
        // 获取当前窗口的所有标签
        const currentWindow = await chrome.windows.getCurrent();
        const tabs = await chrome.tabs.query({ windowId: currentWindow.id });
        
        console.log('获取到的标签数量:', tabs.length);
        console.log('标签列表:', tabs.map(t => ({ title: t.title, url: t.url })));
        
        // 用于匹配URL的函数
        function matchPattern(url, pattern) {
            try {
                // 将通配符模式转换为正则表达式
                let regexPattern = pattern;
                
                // 先把反斜杠转义（必须最先做）
                regexPattern = regexPattern.replace(/\\/g, '\\\\');
                
                // 转义其他正则表达式特殊字符
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
                
                // 最后将 * 转换为 .*
                regexPattern = regexPattern.replace(/\*/g, '.*');
                
                console.log('原始模式:', pattern);
                console.log('转换后的正则:', regexPattern);
                console.log('测试URL:', url);
                
                const regex = new RegExp('^' + regexPattern + '$', 'i');
                const result = regex.test(url);
                
                console.log('匹配结果:', result);
                
                return result;
            } catch (e) {
                console.error('Pattern match error:', e, 'Pattern:', pattern);
                return false;
            }
        }
        
        // 为每个规则创建分组
        let groupedCount = 0;
        
        for (const rule of rules) {
            console.log('=== 处理规则:', rule.name, '===');
            console.log('规则模式:', rule.patterns);
            const matchedTabs = [];
            
            // 找到匹配该规则的所有标签
            for (const tab of tabs) {
                // 检查是否匹配任一模式
                const isMatch = rule.patterns.some(pattern => {
                    const result = matchPattern(tab.url, pattern);
                    if (result) {
                        console.log('✓ 匹配成功:', tab.url, '<=>', pattern);
                    }
                    return result;
                });
                
                if (isMatch) {
                    matchedTabs.push(tab);
                }
            }
            
            console.log('规则', rule.name, '匹配到', matchedTabs.length, '个标签');
            
            // 如果有匹配的标签，创建分组
            if (matchedTabs.length > 0) {
                const tabIds = matchedTabs.map(tab => tab.id);
                
                // 先解散这些标签的现有分组
                await chrome.tabs.ungroup(tabIds);
                
                // 然后创建新的分组
                const groupId = await chrome.tabs.group({ tabIds: tabIds });
                
                await chrome.tabGroups.update(groupId, {
                    title: `${rule.name}_${matchedTabs.length}`,
                    color: rule.color || 'grey',
                    collapsed: false
                });
                
                groupedCount += matchedTabs.length;
            }
        }
        
        // 更新所有分组的标签数量（包括被规则分组影响的旧分组）
        const allGroups = await chrome.tabGroups.query({});
        const allTabs = await chrome.tabs.query({ windowId: currentWindow.id });
        
        // 统计每个分组的实际标签数
        const groupTabCounts = {};
        allTabs.forEach(tab => {
            if (tab.groupId && tab.groupId !== -1) {
                groupTabCounts[tab.groupId] = (groupTabCounts[tab.groupId] || 0) + 1;
            }
        });
        
        // 更新每个分组的标题
        for (const group of allGroups) {
            const actualCount = groupTabCounts[group.id] || 0;
            let currentTitle = group.title || '未命名组';
            
            // 移除旧的数量后缀
            currentTitle = currentTitle.replace(/_\d+$/, '');
            
            // 添加新的实际数量
            const newTitle = `${currentTitle}_${actualCount}`;
            
            await chrome.tabGroups.update(group.id, { title: newTitle });
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


// 打开设置页面
document.getElementById('settingsButton').addEventListener('click', () => {
    chrome.tabs.create({
        url: chrome.runtime.getURL('settings.html')
    });
});


// 解散所有分组
document.getElementById('ungroupButton').addEventListener('click', async () => {
    try {
        const button = document.getElementById('ungroupButton');
        const originalHTML = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '正在解散...';
        
        // 获取当前窗口的所有标签
        const currentWindow = await chrome.windows.getCurrent();
        const tabs = await chrome.tabs.query({ windowId: currentWindow.id });
        
        // 找出所有在组中的标签
        const groupedTabs = tabs.filter(tab => tab.groupId !== -1);
        
        if (groupedTabs.length === 0) {
            alert('当前窗口没有分组的标签');
            button.innerHTML = originalHTML;
            button.disabled = false;
            return;
        }
        
        // 解散所有分组
        const tabIds = groupedTabs.map(tab => tab.id);
        await chrome.tabs.ungroup(tabIds);
        
        // 刷新显示
        await updateStats();
        
        // 显示成功消息
        button.innerHTML = `✓ 已解散 ${groupedTabs.length} 个标签`;
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('Error ungrouping tabs:', error);
        alert('解散分组时出错: ' + error.message);
        
        const button = document.getElementById('ungroupButton');
        button.disabled = false;
        button.innerHTML = originalHTML;
    }
});
