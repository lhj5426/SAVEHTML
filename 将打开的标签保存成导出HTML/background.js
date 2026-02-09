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

      case 'openSettings':
        // 打开设置页面
        await chrome.tabs.create({
          url: chrome.runtime.getURL('settings.html')
        });
        break;
    }
  } catch (error) {
    console.error('右键菜单操作出错:', error);
  }
});
