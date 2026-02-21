// background.js - 右键菜单功能

// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  // 创建父菜单
  chrome.contextMenus.create({
    id: 'closeTabsParent',
    title: '0B.关闭标签',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  // 子菜单项
  chrome.contextMenus.create({
    id: 'closeLeftTabs',
    parentId: 'closeTabsParent',
    title: '←↑ 关闭左上的标签',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  chrome.contextMenus.create({
    id: 'closeRightTabs',
    parentId: 'closeTabsParent',
    title: '↓→ 关闭右下的标签',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  chrome.contextMenus.create({
    id: 'closeOtherTabs',
    parentId: 'closeTabsParent',
    title: '关闭其他标签',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  chrome.contextMenus.create({
    id: 'closeCurrentTab',
    parentId: 'closeTabsParent',
    title: '关闭当前标签',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  chrome.contextMenus.create({
    id: 'separator1',
    parentId: 'closeTabsParent',
    type: 'separator',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  chrome.contextMenus.create({
    id: 'closeCurrentDomain',
    parentId: 'closeTabsParent',
    title: '● 关闭当前域名全部',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  chrome.contextMenus.create({
    id: 'closeExceptCurrentDomain',
    parentId: 'closeTabsParent',
    title: '☆ 除了当前域名全关',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  chrome.contextMenus.create({
    id: 'separator2',
    parentId: 'closeTabsParent',
    type: 'separator',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  chrome.contextMenus.create({
    id: 'removeDuplicates',
    parentId: 'closeTabsParent',
    title: '去重标签',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  chrome.contextMenus.create({
    id: 'cloneActiveTab',
    parentId: 'closeTabsParent',
    title: '克隆标签',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  chrome.contextMenus.create({
    id: 'separator2_5',
    parentId: 'closeTabsParent',
    type: 'separator',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  chrome.contextMenus.create({
    id: 'closeWindow',
    parentId: 'closeTabsParent',
    title: '关闭窗口',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  chrome.contextMenus.create({
    id: 'separator3',
    parentId: 'closeTabsParent',
    type: 'separator',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  // 分组功能
  chrome.contextMenus.create({
    id: 'updateGroupNames',
    parentId: 'closeTabsParent',
    title: '序号组名',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  chrome.contextMenus.create({
    id: 'groupByDomain',
    parentId: 'closeTabsParent',
    title: '按域名分',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  chrome.contextMenus.create({
    id: 'groupByRules',
    parentId: 'closeTabsParent',
    title: '按规则分',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  chrome.contextMenus.create({
    id: 'ungroupAll',
    parentId: 'closeTabsParent',
    title: '解散分组',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  chrome.contextMenus.create({
    id: 'separator5',
    parentId: 'closeTabsParent',
    type: 'separator',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  // 排序功能
  chrome.contextMenus.create({
    id: 'sortByDomain',
    parentId: 'closeTabsParent',
    title: '域名排序',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  chrome.contextMenus.create({
    id: 'sortByTitle',
    parentId: 'closeTabsParent',
    title: '标题排序',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  chrome.contextMenus.create({
    id: 'reverseSort',
    parentId: 'closeTabsParent',
    title: '反向排序',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  chrome.contextMenus.create({
    id: 'separator6',
    parentId: 'closeTabsParent',
    type: 'separator',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  chrome.contextMenus.create({
    id: 'openSettings',
    parentId: 'closeTabsParent',
    title: '分组规则设置',
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
  });

  console.log('右键菜单已创建');
});

// 获取域名的辅助函数
function getDomain(url) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    const parts = hostname.split('.');
    return parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
  } catch (e) {
    return 'unknown';
  }
}

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    const currentTab = tab;
    const windowId = currentTab.windowId;
    const allTabs = await chrome.tabs.query({ windowId: windowId });

    switch (info.menuItemId) {
      case 'closeLeftTabs':
        // 关闭左侧的标签
        const leftTabs = allTabs.filter(t => t.index < currentTab.index);
        if (leftTabs.length > 0) {
          await chrome.tabs.remove(leftTabs.map(t => t.id));
        }
        break;

      case 'closeRightTabs':
        // 关闭右侧的标签
        const rightTabs = allTabs.filter(t => t.index > currentTab.index);
        if (rightTabs.length > 0) {
          await chrome.tabs.remove(rightTabs.map(t => t.id));
        }
        break;

      case 'closeOtherTabs':
        // 关闭其他标签
        const otherTabs = allTabs.filter(t => t.id !== currentTab.id);
        if (otherTabs.length > 0) {
          await chrome.tabs.remove(otherTabs.map(t => t.id));
        }
        break;

      case 'closeCurrentTab':
        // 关闭当前标签
        await chrome.tabs.remove(currentTab.id);
        break;

      case 'closeCurrentDomain':
        // 关闭当前域名的所有标签
        const currentDomain = getDomain(currentTab.url);
        const sameDomainTabs = allTabs.filter(t => getDomain(t.url) === currentDomain);
        if (sameDomainTabs.length > 0) {
          await chrome.tabs.remove(sameDomainTabs.map(t => t.id));
        }
        break;

      case 'closeExceptCurrentDomain':
        // 关闭除了当前域名外的所有标签
        const keepDomain = getDomain(currentTab.url);
        const differentDomainTabs = allTabs.filter(t => getDomain(t.url) !== keepDomain);
        if (differentDomainTabs.length > 0) {
          await chrome.tabs.remove(differentDomainTabs.map(t => t.id));
        }
        break;

      case 'closeWindow':
        // 关闭当前窗口
        await chrome.windows.remove(windowId);
        break;

      case 'removeDuplicates':
        // 去重标签
        const seenUrls = new Set();
        const tabsToClose = [];
        
        allTabs.forEach(t => {
          if (seenUrls.has(t.url)) {
            tabsToClose.push(t.id);
          } else {
            seenUrls.add(t.url);
          }
        });
        
        if (tabsToClose.length > 0) {
          await chrome.tabs.remove(tabsToClose);
        }
        break;

      case 'cloneActiveTab':
        // 克隆当前标签
        await chrome.tabs.create({
          url: currentTab.url,
          index: currentTab.index + 1,
          active: false
        });
        break;

      case 'openSettings':
        // 打开设置页面
        await chrome.tabs.create({
          url: chrome.runtime.getURL('settings.html')
        });
        break;

      case 'updateGroupNames':
        // 序号组名
        const groups = await chrome.tabGroups.query({ windowId: windowId });
        const groupTabCounts = {};
        allTabs.forEach(t => {
          if (t.groupId && t.groupId !== -1) {
            groupTabCounts[t.groupId] = (groupTabCounts[t.groupId] || 0) + 1;
          }
        });
        
        for (const group of groups) {
          const tabCount = groupTabCounts[group.id] || 0;
          let currentTitle = group.title || '未命名组';
          currentTitle = currentTitle.replace(/_\d+$/, '');
          const newTitle = `${currentTitle}_${tabCount}`;
          await chrome.tabGroups.update(group.id, { 
            title: newTitle,
            collapsed: group.collapsed
          });
        }
        break;

      case 'groupByDomain':
        // 按域名分组
        const unpinnedTabs = allTabs.filter(t => !t.pinned);
        const domainMap = {};
        unpinnedTabs.forEach(t => {
          const domain = getDomain(t.url);
          if (!domainMap[domain]) {
            domainMap[domain] = [];
          }
          domainMap[domain].push(t);
        });
        
        const colors = ['blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange', 'grey'];
        let colorIndex = 0;
        
        for (const [domain, domainTabs] of Object.entries(domainMap)) {
          if (domainTabs.length > 1) {
            const tabIds = domainTabs.map(t => t.id);
            const groupId = await chrome.tabs.group({ tabIds: tabIds });
            await chrome.tabGroups.update(groupId, {
              title: `${domain}_${domainTabs.length}`,
              color: colors[colorIndex % colors.length],
              collapsed: true
            });
            colorIndex++;
          }
        }
        break;

      case 'groupByRules':
        // 按规则分组 - 需要读取规则
        const result = await chrome.storage.sync.get(['tabGroupingRules']);
        const rules = result.tabGroupingRules || [];
        
        if (rules.length === 0) {
          break;
        }
        
        const unpinnedTabsForRules = allTabs.filter(t => !t.pinned);
        const pinnedTabsForRules = allTabs.filter(t => t.pinned);
        
        function matchPattern(url, pattern) {
          try {
            let regexPattern = pattern;
            regexPattern = regexPattern.replace(/\\/g, '\\\\');
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
            regexPattern = regexPattern.replace(/\*/g, '.*');
            const regex = new RegExp('^' + regexPattern + '$', 'i');
            return regex.test(url);
          } catch (e) {
            return false;
          }
        }
        
        // 获取所有现有的分组信息
        const existingGroupsForRules = await chrome.tabGroups.query({ windowId: windowId });
        
        // 创建规则名称集合
        const ruleNamesForRules = new Set(rules.map(r => r.name));
        
        // 只解散规则分组,保留手动创建的分组
        const groupsToUngroupForRules = existingGroupsForRules.filter(group => {
          const groupTitle = group.title || '';
          const baseName = groupTitle.replace(/_\d+$/, '');
          return ruleNamesForRules.has(baseName);
        });
        
        // 解散规则分组
        for (const group of groupsToUngroupForRules) {
          const tabsInGroup = unpinnedTabsForRules.filter(t => t.groupId === group.id);
          if (tabsInGroup.length > 0) {
            const tabIds = tabsInGroup.map(t => t.id);
            await chrome.tabs.ungroup(tabIds);
          }
        }
        
        if (groupsToUngroupForRules.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // 收集所有手动分组的标签ID
        const manualGroupTabIdsForRules = new Set();
        for (const group of existingGroupsForRules) {
          const groupTitle = group.title || '';
          const baseName = groupTitle.replace(/_\d+$/, '');
          if (!ruleNamesForRules.has(baseName)) {
            const tabsInGroup = unpinnedTabsForRules.filter(t => t.groupId === group.id);
            tabsInGroup.forEach(t => manualGroupTabIdsForRules.add(t.id));
          }
        }
        
        // 收集所有规则匹配的标签
        const matchedTabIds = new Set();
        const orderedGroups = [];
        
        for (const rule of rules) {
          const matchedTabs = [];
          
          for (const tab of unpinnedTabsForRules) {
            // 跳过已经在手动分组中的标签
            if (manualGroupTabIdsForRules.has(tab.id)) {
              continue;
            }
            
            if (!matchedTabIds.has(tab.id)) {
              const isMatch = rule.patterns.some(pattern => matchPattern(tab.url, pattern));
              if (isMatch) {
                matchedTabs.push(tab);
                matchedTabIds.add(tab.id);
              }
            }
          }
          
          if (matchedTabs.length > 0) {
            orderedGroups.push({ rule, tabs: matchedTabs });
          }
        }
        
        // 未匹配的标签(排除手动分组的标签)
        const unmatchedTabs = unpinnedTabsForRules.filter(t => !matchedTabIds.has(t.id) && !manualGroupTabIdsForRules.has(t.id));
        
        // 按规则顺序移动标签
        let currentIndex = pinnedTabsForRules.length;
        
        for (const { tabs: ruleTabs } of orderedGroups) {
          for (const tab of ruleTabs) {
            await chrome.tabs.move(tab.id, { index: currentIndex });
            currentIndex++;
          }
        }
        
        // 移动未匹配的标签到最后
        for (const tab of unmatchedTabs) {
          await chrome.tabs.move(tab.id, { index: currentIndex });
          currentIndex++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // 创建分组
        for (const { rule, tabs: ruleTabs } of orderedGroups) {
          const tabIds = ruleTabs.map(tab => tab.id);
          const groupId = await chrome.tabs.group({ tabIds: tabIds });
          
          // 确保颜色值是有效的
          const validColors = ['blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange', 'grey'];
          let groupColor = rule.color || 'grey';
          if (!validColors.includes(groupColor)) {
            console.warn('Invalid color in rule:', groupColor, 'defaulting to grey');
            groupColor = 'grey';
          }
          
          await chrome.tabGroups.update(groupId, {
            title: `${rule.name}_${ruleTabs.length}`,
            color: groupColor,
            collapsed: true
          });
        }
        break;

      case 'ungroupAll':
        // 解散所有分组(排除手动创建的分组)
        // 获取规则
        const resultForUngroup = await chrome.storage.sync.get(['tabGroupingRules']);
        const rulesForUngroup = resultForUngroup.tabGroupingRules || [];
        const ruleNamesForUngroup = new Set(rulesForUngroup.map(r => r.name));
        
        // 获取所有分组
        const existingGroupsForUngroup = await chrome.tabGroups.query({ windowId: windowId });
        
        // 只解散规则分组
        const groupsToUngroup = existingGroupsForUngroup.filter(group => {
          const groupTitle = group.title || '';
          const baseName = groupTitle.replace(/_\d+$/, '');
          return ruleNamesForUngroup.has(baseName);
        });
        
        // 解散规则分组
        for (const group of groupsToUngroup) {
          const tabsInGroup = allTabs.filter(t => t.groupId === group.id);
          if (tabsInGroup.length > 0) {
            const tabIds = tabsInGroup.map(t => t.id);
            await chrome.tabs.ungroup(tabIds);
          }
        }
        break;

      case 'sortByDomain':
        // 按域名排序
        await sortTabsInWindow(windowId, 'domain');
        break;

      case 'sortByTitle':
        // 按标题排序
        await sortTabsInWindow(windowId, 'title');
        break;

      case 'reverseSort':
        // 反向排序
        await reverseTabsInWindow(windowId);
        break;
    }
  } catch (error) {
    console.error('右键菜单操作出错:', error);
  }
});

// 排序辅助函数
async function sortTabsInWindow(windowId, sortBy) {
  const allTabs = await chrome.tabs.query({ windowId: windowId });
  const pinnedTabs = allTabs.filter(t => t.pinned);
  const unpinnedTabs = allTabs.filter(t => !t.pinned);
  
  const groups = await chrome.tabGroups.query({ windowId: windowId });
  const groupCollapsedStates = {};
  groups.forEach(group => {
    groupCollapsedStates[group.id] = group.collapsed;
  });
  
  const tabsByGroup = {};
  const ungroupedTabs = [];
  
  unpinnedTabs.forEach(tab => {
    if (tab.groupId && tab.groupId !== -1) {
      if (!tabsByGroup[tab.groupId]) {
        tabsByGroup[tab.groupId] = [];
      }
      tabsByGroup[tab.groupId].push(tab);
    } else {
      ungroupedTabs.push(tab);
    }
  });
  
  function sortTabs(tabs) {
    return [...tabs].sort((a, b) => {
      if (sortBy === 'domain') {
        const domainA = getDomain(a.url);
        const domainB = getDomain(b.url);
        const domainCompare = domainA.localeCompare(domainB);
        if (domainCompare !== 0) return domainCompare;
        return (a.title || '').localeCompare(b.title || '');
      } else if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });
  }
  
  for (const groupId in tabsByGroup) {
    tabsByGroup[groupId] = sortTabs(tabsByGroup[groupId]);
  }
  
  const sortedUngrouped = sortTabs(ungroupedTabs);
  
  let currentIndex = pinnedTabs.length;
  
  for (const groupId in tabsByGroup) {
    const groupTabs = tabsByGroup[groupId];
    for (const tab of groupTabs) {
      await chrome.tabs.move(tab.id, { index: currentIndex });
      currentIndex++;
    }
  }
  
  for (const tab of sortedUngrouped) {
    await chrome.tabs.move(tab.id, { index: currentIndex });
    currentIndex++;
  }
  
  await new Promise(resolve => setTimeout(resolve, 150));
  
  for (const [groupId, collapsed] of Object.entries(groupCollapsedStates)) {
    try {
      await chrome.tabGroups.update(parseInt(groupId), { collapsed: collapsed });
    } catch (e) {
      // Ignore errors
    }
  }
}

// 反向排序辅助函数
async function reverseTabsInWindow(windowId) {
  const allTabs = await chrome.tabs.query({ windowId: windowId });
  const pinnedTabs = allTabs.filter(t => t.pinned);
  const unpinnedTabs = allTabs.filter(t => !t.pinned);
  
  const groups = await chrome.tabGroups.query({ windowId: windowId });
  const groupCollapsedStates = {};
  groups.forEach(group => {
    groupCollapsedStates[group.id] = group.collapsed;
  });
  
  const tabsByGroup = {};
  const ungroupedTabs = [];
  const tabGroupMap = {};
  
  unpinnedTabs.forEach(tab => {
    if (tab.groupId && tab.groupId !== -1) {
      tabGroupMap[tab.id] = tab.groupId;
      if (!tabsByGroup[tab.groupId]) {
        tabsByGroup[tab.groupId] = [];
      }
      tabsByGroup[tab.groupId].push(tab);
    } else {
      ungroupedTabs.push(tab);
    }
  });
  
  for (const groupId in tabsByGroup) {
    tabsByGroup[groupId].reverse();
  }
  
  ungroupedTabs.reverse();
  
  const groupedTabIds = Object.values(tabsByGroup).flat().map(tab => tab.id);
  if (groupedTabIds.length > 0) {
    await chrome.tabs.ungroup(groupedTabIds);
  }
  
  let currentIndex = pinnedTabs.length;
  const newGroupOrder = [];
  
  for (const groupId in tabsByGroup) {
    const groupTabs = tabsByGroup[groupId];
    const groupTabIds = [];
    for (const tab of groupTabs) {
      await chrome.tabs.move(tab.id, { index: currentIndex });
      groupTabIds.push(tab.id);
      currentIndex++;
    }
    newGroupOrder.push({ groupId: parseInt(groupId), tabIds: groupTabIds });
  }
  
  for (const tab of ungroupedTabs) {
    await chrome.tabs.move(tab.id, { index: currentIndex });
    currentIndex++;
  }
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  for (const { groupId, tabIds } of newGroupOrder) {
    const newGroupId = await chrome.tabs.group({ tabIds: tabIds });
    const originalGroup = groups.find(g => g.id === groupId);
    if (originalGroup) {
      await chrome.tabGroups.update(newGroupId, {
        title: originalGroup.title,
        color: originalGroup.color,
        collapsed: groupCollapsedStates[groupId] || false
      });
    }
  }
}
