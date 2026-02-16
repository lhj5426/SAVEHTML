// popup.js
function getSVGIcon() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
      <!-- Background -->
      <rect x="0" y="0" width="128" height="128" rx="24" fill="#FF6B6B"/>
      
      <!-- Large Bookmark Base -->
      <path d="M16 16 L112 16 L112 112 L64 94 L16 112 Z" fill="white"/>
      
      <!-- Internal Tabs -->
      <g transform="translate(26, 30)">
        <!-- Bottom tab -->
        <rect x="0" y="44" width="76" height="14" rx="3" fill="#FF6B6B" opacity="0.4"/>
        
        <!-- Middle tab -->
        <rect x="0" y="22" width="76" height="14" rx="3" fill="#FF6B6B" opacity="0.7"/>
        
        <!-- Top tab -->
        <rect x="0" y="0" width="76" height="14" rx="3" fill="#FF6B6B"/>
      </g>
    </svg>`;
    
    return `data:image/svg+xml;base64,${btoa(svg.trim())}`;
  }

async function getProfileInfo() {
    try {
      const userInfo = await new Promise((resolve) => {
        chrome.identity.getProfileUserInfo({ accountStatus: 'ANY' }, (info) => {
          if (chrome.runtime.lastError) {
            console.log('Error getting profile info:', chrome.runtime.lastError);
            resolve({});
          } else {
            resolve(info);
          }
        });
      });
      
      const windows = await chrome.windows.getAll();
      
      return {
        name: userInfo.email ? userInfo.email.split('@')[0] : 'Chrome Profile',
        email: userInfo.email || 'Not Signed In',
        windowCount: windows.length
      };
    } catch (error) {
      console.error('Error getting profile info:', error);
      return {
        name: 'Chrome Profile',
        email: 'Not Signed In',
        windowCount: 1
      };
    }
  }
  
  async function getAllTabs() {
    const windows = await chrome.windows.getAll();
    let allTabs = [];
    
    for (const window of windows) {
      const tabs = await chrome.tabs.query({ windowId: window.id });
      allTabs = allTabs.concat(tabs);
    }
    
    return allTabs;
  }
  
  async function getTabGroups() {
    try {
      const groups = await chrome.tabGroups.query({});
      return groups;
    } catch (error) {
      console.error('Error getting tab groups:', error);
      return [];
    }
  }
  
  function groupTabsByTabGroup(tabs, tabGroups) {
    const grouped = {
      ungrouped: []
    };
    
    // Create a map of group IDs to group info
    const groupMap = {};
    tabGroups.forEach(group => {
      groupMap[group.id] = {
        title: group.title || `未命名组 (ID: ${group.id})`,
        color: group.color || 'grey',
        collapsed: group.collapsed
      };
      grouped[group.id] = [];
    });
    
    // Group tabs
    tabs.forEach(tab => {
      if (tab.groupId && tab.groupId !== -1) {
        if (!grouped[tab.groupId]) {
          grouped[tab.groupId] = [];
        }
        grouped[tab.groupId].push(tab);
      } else {
        grouped.ungrouped.push(tab);
      }
    });
    
    return { grouped, groupMap };
  }
  
  function getBaseDomain(url) {
    try {
      const hostname = new URL(url).hostname.replace('www.', '');
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        return parts.slice(-2).join('.');
      }
      return hostname;
    } catch {
      return 'unknown';
    }
  }
  
  // URL解码函数，并判断是否需要解码
  function decodeUrlIfNeeded(url) {
    try {
      // 对整个URL进行解码
      let decodedUrl = decodeURI(url);
      
      // 对查询参数部分单独解码
      const queryIndex = decodedUrl.indexOf('?');
      if (queryIndex !== -1) {
        const baseUrl = decodedUrl.substring(0, queryIndex);
        const queryString = decodedUrl.substring(queryIndex + 1);
        
        const params = queryString.split('&');
        const decodedParams = params.map(param => {
          const [key, value] = param.split('=');
          return `${key}=${value ? decodeURIComponent(value) : ''}`;
        });
        
        decodedUrl = `${baseUrl}?${decodedParams.join('&')}`;
      }
      
      // 比较原始URL和解码后的URL，如果不同则返回解码结果，否则返回null
      return decodedUrl !== url ? decodedUrl : null;
    } catch (e) {
      // 如果解码失败，返回null
      return null;
    }
  }
  
  function sortTabs(tabs, sortBy = 'lastAccessed', ascending = false) {
    return [...tabs].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'lastAccessed':
          // Handle cases where either or both timestamps are missing
          if (!a.lastAccessed && !b.lastAccessed) comparison = 0;
          else if (!a.lastAccessed) comparison = 1;  // Push unknown timestamps to end
          else if (!b.lastAccessed) comparison = -1; // Push unknown timestamps to end
          else {
            // Convert string dates to timestamps for proper comparison
            const dateA = new Date(a.lastAccessed).getTime();
            const dateB = new Date(b.lastAccessed).getTime();
            comparison = dateB - dateA;  // Newer dates first
          }
          break;
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'url':
          comparison = a.url.localeCompare(b.url);
          break;
      }
      
      return ascending ? -comparison : comparison;
    });
  }
  
  function groupTabsByDomain(tabs) {
    const groups = {};
    tabs.forEach(tab => {
      const domain = getBaseDomain(tab.url);
      if (!groups[domain]) {
        groups[domain] = [];
      }
      groups[domain].push(tab);
    });
    
    return Object.keys(groups)
      .sort()
      .reduce((acc, domain) => {
        acc[domain] = sortTabs(groups[domain], 'lastAccessed', false);
        return acc;
      }, {});
  }
  
  function getGroupColor(colorName) {
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
    return colorMap[colorName] || colorMap['grey'];
  }
  
  function generateTabEntry(tab, index = null) {
    // 尝试解码URL，如果需要解码则返回解码结果，否则返回null
    const decodedUrl = decodeUrlIfNeeded(tab.url);
    
    // 只有当需要解码时才添加解码后的URL行
    const decodedUrlHtml = decodedUrl ? 
      `<div class="tab-decoded-url">URL解码: ${decodedUrl}</div>` : 
      '';
    
    // 序号HTML (如果提供了index)
    const indexHtml = index !== null ? 
      `<span class="tab-index">${index}</span>` : 
      '';
    
    // 修正点：确保返回的HTML模板中没有多余的注释文本
    return `
      <div class="tab-entry" data-url="${tab.url}" data-title="${tab.title || ''}">
        ${indexHtml}
        <input type="checkbox" class="tab-checkbox" onclick="window.updateSelectionState()">
        <img class="tab-icon" src="${tab.favIconUrl || ''}" onerror="this.style.backgroundColor='#e0e0e0'">
        <div class="tab-content">
          <a href="${tab.url}" class="tab-title" target="_blank" onmousedown="window.handleLinkClick(event)">${tab.title || tab.url}</a>
          <div class="tab-url-container">
            <span class="tab-url-toggle" onclick="window.toggleUrl(this)">▶ 显示URL</span>
            <div class="tab-url collapsed">${tab.url}</div>
          </div>
          ${decodedUrlHtml}
          <div class="visit-info">
            <span class="visit-time"></span>
            <span class="visit-count"></span>
          </div>
        </div>
      </div>
    `;
  }
  
  function generateHTML(tabs, profile, tabGroups = []) {
    const date = new Date().toLocaleString();
    const tabCount = tabs.length;
    const tabsByLastAccessed = sortTabs(tabs, 'lastAccessed', false);
    const tabsByTitle = sortTabs(tabs, 'title', true);
    const tabsByUrl = sortTabs(tabs, 'url', true);
    const groupedTabs = groupTabsByDomain(tabs);
    
    // Create a map of group IDs to group info
    const groupInfoMap = {};
    tabGroups.forEach(group => {
      groupInfoMap[group.id] = {
        title: group.title || '未命名组',
        color: group.color || 'grey',
        collapsed: group.collapsed
      };
    });
    
    // Get tab groups data from the tabs
    const tabGroupsData = {};
    const ungroupedTabs = [];
    
    tabs.forEach(tab => {
      if (tab.groupId && tab.groupId !== -1) {
        if (!tabGroupsData[tab.groupId]) {
          const groupInfo = groupInfoMap[tab.groupId] || {
            title: `未命名组`,
            color: 'grey'
          };
          tabGroupsData[tab.groupId] = {
            tabs: [],
            color: groupInfo.color,
            title: groupInfo.title
          };
        }
        tabGroupsData[tab.groupId].tabs.push(tab);
      } else {
        ungroupedTabs.push(tab);
      }
    });
    
    const tabGroupsHTML = Object.entries(tabGroupsData).map(([groupId, groupData]) => `
      <div class="tab-group">
        <div class="group-header" onclick="window.toggleGroup(this)">
          <span class="group-header-title">
            <input type="checkbox" class="group-select-checkbox" onclick="window.toggleGroupSelection(this)">
            <span class="group-color-indicator" style="background-color: ${getGroupColor(groupData.color)}"></span>
            ${groupData.title} 【共有${groupData.tabs.length}个标签】
          </span>
          <span class="toggle-icon">▾</span>
        </div>
        <div class="group-content">
          ${groupData.tabs.map((tab, index) => generateTabEntry(tab, index + 1)).join('')}
        </div>
      </div>
    `).join('');
    
    const ungroupedHTML = ungroupedTabs.length > 0 ? `
      <div class="tab-group">
        <div class="group-header" onclick="window.toggleGroup(this)">
          <span class="group-header-title">
            <input type="checkbox" class="group-select-checkbox" onclick="window.toggleGroupSelection(this)">
            未分组标签 【共有${ungroupedTabs.length}个标签】
          </span>
          <span class="toggle-icon">▾</span>
        </div>
        <div class="group-content">
          ${ungroupedTabs.map((tab, index) => generateTabEntry(tab, index + 1)).join('')}
        </div>
      </div>
    ` : '';
    
    return `
  <!DOCTYPE html> <html>
  <head>
    <meta charset="UTF-8">
    <title>Saved Tabs - ${date}</title>
    <link rel="icon" type="image/svg+xml" href="${getSVGIcon()}">
    <link rel="shortcut icon" type="image/svg+xml" href="${getSVGIcon()}">
    <link rel="alternate icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAFdQTFRF/////Gtr/Gtr/Gtr/Gtr/Gtr/Gtr/Gtr/Gtr/Gtr/Gtr/Gtr/Gtr/////v7+7e3t1NTUsrKyj4+PZ2dnQkJCJiYmDw8PCAgIBAQEAgICAAAA////L/uJOwAAAAF0Uk5TAEDm2GYAAAABYktHRACIBR1IAAAACXBIWXMAAABIAAAASABGyWs+AAAARklEQVQ4y2NgGPKAEQUwIHGYUAATEoeZAR3AzMgEBLDAgc4J4QQJADlBAsg2wTghAOjJEeBJNk4QB3rysPAk2pNonjwkPQkAn+SQj7PzT5IAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjQtMDItMDVUMTc6NDc6MTUrMDA6MDCX1bBDAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDI0LTAyLTA1VDE3OjQ3OjE1KzAwOjAw5ogI/wAAACh0RVh0ZGF0ZTp0aW1lc3RhbXAAMjAyNC0wMi0wNVQxNzo0NzoxNSswMDowMLGdKSAAAAAASUVORK5CYII=">
    
    <style>
      body {
        font-family: Arial, sans-serif;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f5f5f5;
      }
      .static-header {
        background-color: #fff;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .sticky-controls {
        position: sticky;
        top: 15px;
        z-index: 1000;
        background-color: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(8px);
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 15px;
      }
      .button-group {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .button {
        padding: 8px 16px;
        background: #2196F3;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        white-space: nowrap;
      }
      .button:hover:not(:disabled) {
        background: #1976D2;
      }
      .button:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }
      .selection-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          white-space: nowrap;
          margin-left: 10px;
      }
      .selection-bar label {
          cursor: pointer;
          user-select: none;
      }
      .search-container {
        flex-grow: 1;
        min-width: 200px;
      }
      .search-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;
      }
      .view-controls {
        margin: 0 0 20px 0;
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
      }
      .view-button {
        padding: 8px 16px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
      }
      .view-button.active {
        background: #2196F3;
        color: white;
        border-color: #2196F3;
      }
      .tabs-container {
        background-color: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .tab-entry {
        padding: 15px;
        border-bottom: 1px solid #eee;
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }
      .tab-entry:last-child {
        border-bottom: none;
      }
      .tab-entry.hidden {
        display: none;
      }
      .tab-entry.selected {
        background-color: #e3f2fd;
      }
      .tab-index {
        min-width: 30px;
        text-align: right;
        font-weight: bold;
        color: #666;
        font-size: 14px;
        margin-top: 2px;
        flex-shrink: 0;
      }
      .tab-checkbox {
          margin-top: 2px;
          cursor: pointer;
      }
      .tab-icon {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        border-radius: 3px;
        margin-top: 2px;
      }
      .tab-content {
        flex-grow: 1;
        min-width: 0;
      }
      .tab-title {
        color: #2196F3;
        text-decoration: none;
        font-weight: 500;
        display: block;
        margin-bottom: 5px;
        word-break: break-word;
        background-color: #E8F5E9;
        padding: 4px 8px;
        border-radius: 4px;
      }
      .tab-title:hover {
        text-decoration: underline;
      }
      
      /* --- 5.0 ULTIMATE: Rainbow Memory Colors --- */
      .tab-title.visited-count-1 { color: #E53935 !important; } /* 1. 赤 */
      .tab-title.visited-count-2 { color: #FB8C00 !important; } /* 2. 橙 */
      .tab-title.visited-count-3 { color: #FDD835 !important; } /* 3. 黄 */
      .tab-title.visited-count-4 { color: #43A047 !important; } /* 4. 绿 */
      .tab-title.visited-count-5 { color: #00ACC1 !important; } /* 5. 青 */
      .tab-title.visited-count-6 { color: #1E88E5 !important; } /* 6. 蓝 */
      .tab-title.visited-count-7 { color: #5E35B1 !important; } /* 7. 紫 */

      .tab-url {
        color: #666;
        font-size: 0.85em;
        word-break: break-all;
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease, padding 0.3s ease;
        background-color: #FFEBEE;
        padding: 0 8px;
        border-radius: 4px;
      }
      .tab-url.expanded {
        max-height: 500px;
        margin-top: 4px;
        padding: 6px 8px;
      }
      .tab-url-container {
        margin-top: 4px;
      }
      .tab-url-toggle {
        color: #2196F3;
        font-size: 0.85em;
        cursor: pointer;
        user-select: none;
        display: inline-block;
      }
      .tab-url-toggle:hover {
        text-decoration: underline;
      }
      .tab-decoded-url {
        color: #1976D2;
        font-size: 0.85em;
        word-break: break-all;
        margin-top: 4px;
        background-color: #E3F2FD;
        padding: 6px 8px;
        border-radius: 4px;
      }
      .visit-info {
        display: flex;
        gap: 15px;
        font-size: 0.8em;
        margin-top: 6px;
        font-style: italic;
      }
      .visit-time { color: #009688; }
      .visit-count { color: #E91E63; font-weight: bold; }
      
      .stats {
        display: flex;
        gap: 20px;
      }
      .stat-item {
        color: #666;
      }
      .tab-group {
        margin-bottom: 20px;
      }
      .group-header {
        font-size: 1.1em;
        font-weight: 500;
        color: #666;
        padding: 10px;
        background: #f5f5f5;
        border-radius: 4px;
        margin-bottom: 10px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .group-header-title {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .group-color-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        display: inline-block;
      }
      .group-select-checkbox {
        cursor: pointer;
      }
      .group-header:hover {
        background: #e0e0e0;
      }
      .toggle-icon {
        font-family: system-ui, -apple-system, sans-serif;
        transition: transform 0.2s ease;
      }
      .collapsed .toggle-icon {
        transform: rotate(-90deg);
      }
      .group-content {
        transition: max-height 0.3s ease-out;
        overflow: hidden;
      }
      .group-content.collapsed {
        max-height: 0;
      }
      .views > div {
        display: none;
      }
      .views > div.active {
        display: block;
      }
      .no-results {
        text-align: center;
        padding: 20px;
        color: #666;
        display: none;
      }
       .popup-blocker-notice {
        flex-basis: 100%;
        padding: 10px;
        margin-top: 10px;
        background-color: #fffbe6;
        border: 1px solid #ffe58f;
        border-radius: 6px;
        color: #8a6d3b;
        text-align: center;
        display: none;
      }
    </style>
  </head>
  <body>
    <!-- Static part of the header -->
    <div class="static-header">
      <div class="stats">
        <div class="stat-item">
          <strong>总标签数:</strong> ${tabCount}
        </div>
        <div class="stat-item">
          <strong>标签组数:</strong> ${Object.keys(tabGroupsData).length}
        </div>
        <div class="stat-item">
          <strong>保存时间:</strong> ${date}
        </div>
      </div>
    </div>

    <!-- Sticky part of the header -->
    <div class="sticky-controls">
      <div class="button-group">
        <button class="button" onclick="window.openTabsBySelector('.tab-entry')">打开全部标签</button>
        <button class="button" onclick="window.openTabsBySelector('.views > .active .tab-entry:not(.hidden)')">打开过滤后的标签</button>
        <button class="button" id="openSelectedButton" onclick="window.openTabsBySelector('.tab-checkbox:checked')" disabled>打开选中的标签</button>
        <button class="button" style="background: #FF9800;" id="toggleAllUrlsButton" onclick="window.toggleAllUrls()">一键展开所有URL</button>
        <button class="button" style="background: #F44336;" onclick="window.clearVisitHistory()">清除访问历史</button>
      </div>
      <div class="selection-bar">
         <input type="checkbox" id="selectAllCheckbox" onchange="window.toggleSelectAll(this.checked)">
         <label for="selectAllCheckbox">全选当前可见</label>
      </div>
      <div class="search-container">
         <input type="text" class="search-input" placeholder="按标题或网址搜索标签页" oninput="window.searchTabs(this.value)">
      </div>
      <div id="popupBlockerNotice" class="popup-blocker-notice">
        <b>提示:</b> 浏览器可能阻止了打开多个标签页。请检查地址栏右侧是否有拦截图标，并选择 <b>“始终允许...”</b>，然后重试。
      </div>
    </div>

    <div class="view-controls">
      <button class="view-button active" data-view="recent">最新</button>
      <button class="view-button" data-view="alphabetical">按字母顺序</button>
      <button class="view-button" data-view="url">按网址</button>
      <button class="view-button" data-view="byTabGroup">按标签组</button>
      <button class="view-button" data-view="grouped">按域名分组</button>
    </div>
    
    <div class="views">
      <div class="tabs-container active" id="recent">
        ${tabsByLastAccessed.map((tab, index) => generateTabEntry(tab, index + 1)).join('')}
      </div>
      
      <div class="tabs-container" id="alphabetical">
        ${tabsByTitle.map((tab, index) => generateTabEntry(tab, index + 1)).join('')}
      </div>
      
      <div class="tabs-container" id="url">
        ${tabsByUrl.map((tab, index) => generateTabEntry(tab, index + 1)).join('')}
      </div>
      
      <div class="tabs-container" id="byTabGroup">
        ${tabGroupsHTML}
        ${ungroupedHTML}
      </div>
      
      <div class="tabs-container" id="grouped">
        ${Object.entries(groupedTabs).map(([domain, domainTabs]) => `
          <div class="tab-group">
            <div class="group-header" onclick="window.toggleGroup(this)">
              <span class="group-header-title">
                <input type="checkbox" class="group-select-checkbox" onclick="window.toggleGroupSelection(this)">
                ${domain} 【当前域名共有${domainTabs.length}个标签】
              </span>
              <span class="toggle-icon">▾</span>
            </div>
            <div class="group-content">
              ${domainTabs.map((tab, index) => generateTabEntry(tab, index + 1)).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="no-results" id="noResultsMessage">没有找到匹配的标签页</div>
    
    <script>
      const STORAGE_KEY = 'tabSaverVisitedLinks';
      let popupNoticeShown = false;

      // --- 5.0 ULTIMATE: localStorage Logic with Rainbow Colors ---
      function getVisitedLinks() {
          try {
              const data = localStorage.getItem(STORAGE_KEY);
              return data ? JSON.parse(data) : {};
          } catch (e) { return {}; }
      }

      function updateVisitInfoInDOM(element, visitData) {
          const { lastVisited, count } = visitData;
          const visitTimeEl = element.querySelector('.visit-time');
          const visitCountEl = element.querySelector('.visit-count');
          const titleLink = element.querySelector('.tab-title');

          if (visitTimeEl && lastVisited) {
              const visitDate = new Date(lastVisited);
              visitTimeEl.textContent = '上次访问: ' + visitDate.toLocaleString();
          }
          if (visitCountEl && count > 0) {
              visitCountEl.textContent = '访问 ' + count + ' 次';
          }
          
          if (titleLink) {
              // Remove all previous color classes
              for (let i = 1; i <= 7; i++) {
                  titleLink.classList.remove('visited-count-' + i);
              }
              // Add the new color class based on the count, cycling through 7 colors
              if (count > 0) {
                  const colorIndex = ((count - 1) % 7) + 1;
                  titleLink.classList.add('visited-count-' + colorIndex);
              }
          }
      }

      // --- New handler to capture all types of clicks ---
      // 这个函数会捕获鼠标左键、中键点击，然后调用 recordVisit。
      window.handleLinkClick = function(event) {
          // event.button: 0=左键, 1=中键, 2=右键
          // 我们只关心左键和中键的点击，忽略右键等。
          if (event.button > 1) {
              return;
          }

          // event.currentTarget 指向绑定了事件的 <a> 元素
          const linkElement = event.currentTarget; 
          // 找到包含这个链接的父级 .tab-entry 元素
          const tabEntry = linkElement.closest('.tab-entry');

          if (tabEntry) {
              // 调用您已有的函数来记录访问
              window.recordVisit(tabEntry);
          }
      };

      function recordVisit(element) {
          const url = element.dataset.url;
          if (!url) return;

          const visitedLinks = getVisitedLinks();
          const existingData = visitedLinks[url] || { count: 0 };
          
          const newData = {
              lastVisited: new Date().toISOString(),
              count: (existingData.count || 0) + 1
          };
          
          visitedLinks[url] = newData;
          
          try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(visitedLinks));
          } catch (e) { console.error('Error saving to localStorage', e); }

          updateVisitInfoInDOM(element, newData);
      }

      function applyVisitHistory() {
          const visitedLinks = getVisitedLinks();
          document.querySelectorAll('.tab-entry').forEach(entry => {
              const url = entry.dataset.url;
              if (visitedLinks[url]) {
                  updateVisitInfoInDOM(entry, visitedLinks[url]);
              }
          });
      }

      // --- Clear Visit History Function ---
      window.clearVisitHistory = function() {
          try {
              localStorage.removeItem(STORAGE_KEY);
              
              // 清除页面上所有的访问信息显示
              document.querySelectorAll('.tab-entry').forEach(entry => {
                  const visitTimeEl = entry.querySelector('.visit-time');
                  const visitCountEl = entry.querySelector('.visit-count');
                  const titleLink = entry.querySelector('.tab-title');
                  
                  if (visitTimeEl) visitTimeEl.textContent = '';
                  if (visitCountEl) visitCountEl.textContent = '';
                  
                  // 移除所有彩虹颜色类
                  if (titleLink) {
                      for (let i = 1; i <= 7; i++) {
                          titleLink.classList.remove('visited-count-' + i);
                      }
                  }
              });
          } catch (e) {
              console.error('清除访问历史时出错:', e);
          }
      };

      // --- Core Tab Opening Logic ---
      window.openTabsBySelector = function(selector) {
        let entries;
        if (selector === '.tab-checkbox:checked') {
            entries = Array.from(document.querySelectorAll(selector)).map(cb => cb.closest('.tab-entry'));
        } else {
            entries = document.querySelectorAll(selector);
        }

        const validEntries = Array.from(entries).filter(entry => {
            const url = entry.dataset.url;
            return url && (url.startsWith('http') || url.startsWith('file') || url.startsWith('chrome-extension'));
        });
        
        if (validEntries.length === 0) return;

        validEntries.forEach(entry => recordVisit(entry));

        let openedWindow = null;
        validEntries.forEach((entry, index) => {
          const newWindow = window.open(entry.dataset.url, '_blank');
          if (index === 0) openedWindow = newWindow;
        });
        
        setTimeout(() => {
          const notice = document.getElementById('popupBlockerNotice');
          if (validEntries.length > 1 && (!openedWindow || openedWindow.closed || typeof openedWindow.closed == 'undefined')) {
            if (!popupNoticeShown) {
                notice.style.display = 'block';
                popupNoticeShown = true;
            }
          } else {
            notice.style.display = 'none';
          }
        }, 500);
      };

      // --- URL Toggle Function ---
      window.toggleUrl = function(toggleElement) {
        const urlElement = toggleElement.nextElementSibling;
        if (urlElement.classList.contains('collapsed')) {
          urlElement.classList.remove('collapsed');
          urlElement.classList.add('expanded');
          toggleElement.textContent = '▼ 隐藏URL';
        } else {
          urlElement.classList.remove('expanded');
          urlElement.classList.add('collapsed');
          toggleElement.textContent = '▶ 显示URL';
        }
      };

      // --- Toggle All URLs Function ---
      let allUrlsExpanded = false;
      window.toggleAllUrls = function() {
        const button = document.getElementById('toggleAllUrlsButton');
        const activeView = document.querySelector('.views > .active');
        if (!activeView) return;

        const allToggles = activeView.querySelectorAll('.tab-url-toggle');
        const allUrls = activeView.querySelectorAll('.tab-url');

        if (!allUrlsExpanded) {
          // 展开所有URL
          allUrls.forEach(url => {
            url.classList.remove('collapsed');
            url.classList.add('expanded');
          });
          allToggles.forEach(toggle => {
            toggle.textContent = '▼ 隐藏URL';
          });
          button.textContent = '一键隐藏所有URL';
          button.style.background = '#4CAF50';
          allUrlsExpanded = true;
        } else {
          // 隐藏所有URL
          allUrls.forEach(url => {
            url.classList.remove('expanded');
            url.classList.add('collapsed');
          });
          allToggles.forEach(toggle => {
            toggle.textContent = '▶ 显示URL';
          });
          button.textContent = '一键展开所有URL';
          button.style.background = '#FF9800';
          allUrlsExpanded = false;
        }
      };

      // --- UI and Interaction Logic ---
      window.searchTabs = function(query) {
        query = query.toLowerCase().trim();
        const activeViewSelector = '.views > .active';
        const activeView = document.querySelector(activeViewSelector);
        if (!activeView) return;

        let anyResults = false;
        
        activeView.querySelectorAll('.tab-entry').forEach(entry => {
          const title = (entry.dataset.title || '').toLowerCase();
          const url = (entry.dataset.url || '').toLowerCase();
          const isMatch = title.includes(query) || url.includes(query);
          entry.classList.toggle('hidden', !isMatch);
          if (isMatch) anyResults = true;
        });

        if(activeView.id === 'grouped') {
            let hasGroupResults = false;
            activeView.querySelectorAll('.tab-group').forEach(group => {
                const visibleEntriesInGroup = group.querySelectorAll('.tab-entry:not(.hidden)').length > 0;
                group.style.display = visibleEntriesInGroup ? '' : 'none';
                if (visibleEntriesInGroup) hasGroupResults = true;
            });
            anyResults = hasGroupResults;
        }

        document.getElementById('noResultsMessage').style.display = anyResults ? 'none' : 'block';
        
        window.updateSelectionState();
      };

      window.updateSelectionState = function() {
        // --- Visual Update ---
        document.querySelectorAll('.tab-checkbox').forEach(cb => {
            cb.closest('.tab-entry').classList.toggle('selected', cb.checked);
        });

        // --- State Calculation ---
        const activeViewSelector = '.views > .active';
        const allVisibleCheckboxes = Array.from(document.querySelectorAll(\`\${activeViewSelector} .tab-entry:not(.hidden) .tab-checkbox\`));
        const selectedVisibleCheckboxes = allVisibleCheckboxes.filter(cb => cb.checked);
        
        const totalSelectedCount = document.querySelectorAll('.tab-checkbox:checked').length;
        
        // --- Button and Main "Select All" Checkbox Update ---
        const openSelectedBtn = document.getElementById('openSelectedButton');
        openSelectedBtn.disabled = totalSelectedCount === 0;
        openSelectedBtn.textContent = totalSelectedCount > 0 ? \`打开选中的 (\${totalSelectedCount})\` : '打开选中的标签';
        
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        if (allVisibleCheckboxes.length > 0) {
            selectAllCheckbox.checked = allVisibleCheckboxes.length === selectedVisibleCheckboxes.length;
            selectAllCheckbox.indeterminate = selectedVisibleCheckboxes.length > 0 && selectedVisibleCheckboxes.length < allVisibleCheckboxes.length;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }

        // --- 3.0: Group Checkbox State Update ---
        document.querySelectorAll('.tab-group').forEach(group => {
            const groupCheckbox = group.querySelector('.group-select-checkbox');
            if (!groupCheckbox) return;

            const itemCheckboxes = Array.from(group.querySelectorAll('.tab-checkbox'));
            const checkedItems = itemCheckboxes.filter(cb => cb.checked);

            if (itemCheckboxes.length > 0) {
                if (checkedItems.length === itemCheckboxes.length) {
                    groupCheckbox.checked = true;
                    groupCheckbox.indeterminate = false;
                } else if (checkedItems.length === 0) {
                    groupCheckbox.checked = false;
                    groupCheckbox.indeterminate = false;
                } else {
                    groupCheckbox.checked = false;
                    groupCheckbox.indeterminate = true;
                }
            } else {
                 groupCheckbox.checked = false;
                 groupCheckbox.indeterminate = false;
            }
        });
      };

      window.toggleSelectAll = function(checked) {
        const selector = '.views > .active .tab-entry:not(.hidden) .tab-checkbox';
        document.querySelectorAll(selector).forEach(cb => {
          cb.checked = checked;
        });
        window.updateSelectionState();
      };
      
      // --- 3.0: New Function for Group Selection ---
      window.toggleGroupSelection = function(groupCheckbox) {
          event.stopPropagation(); // Prevent the group from collapsing when clicking the checkbox
          const groupContent = groupCheckbox.closest('.group-header').nextElementSibling;
          const itemCheckboxes = groupContent.querySelectorAll('.tab-checkbox');
          
          itemCheckboxes.forEach(cb => {
              cb.checked = groupCheckbox.checked;
          });
          
          window.updateSelectionState();
      };

      window.toggleGroup = function(header) {
        header.classList.toggle('collapsed');
        header.nextElementSibling.classList.toggle('collapsed');
      };

      // --- View Switching Logic ---
      document.querySelectorAll('.view-button').forEach(button => {
        button.addEventListener('click', () => {
          document.querySelectorAll('.tab-checkbox, .group-select-checkbox').forEach(cb => cb.checked = false);
          
          document.querySelectorAll('.view-button').forEach(b => b.classList.remove('active'));
          button.classList.add('active');
          document.querySelectorAll('.views > div').forEach(view => view.classList.remove('active'));
          document.getElementById(button.dataset.view).classList.add('active');
          
          document.querySelector('.search-input').value = '';
          window.searchTabs(''); 
        });
      });
      
      // Initial state on load
      document.addEventListener('DOMContentLoaded', () => {
        applyVisitHistory(); 
        window.updateSelectionState();
      });
    </script>
  </body>
  </html>
    `;
  }
  
  document.getElementById('saveButton').addEventListener('click', async () => {
    const status = document.getElementById('status');
    status.textContent = '正在保存标签页...';
    
    try {
      const allTabs = await getAllTabs();
      
      // 过滤掉浏览器内部页面
      const tabs = allTabs.filter(tab => {
        const url = tab.url.toLowerCase();
        return !url.startsWith('chrome://') && 
               !url.startsWith('edge://') && 
               !url.startsWith('vivaldi://') && 
               !url.startsWith('about:') &&
               !url.startsWith('chrome-extension://') &&
               !url.startsWith('edge-extension://') &&
               !url.startsWith('extension://') &&
               !url.startsWith('file://');
      });
      
      const profile = await getProfileInfo();
      
      // Get tab groups information
      const tabGroups = await chrome.tabGroups.query({});
      
      const html = generateHTML(tabs, profile, tabGroups);
      
      // 更新统计信息
      document.getElementById('tabCount').textContent = tabs.length;
      document.getElementById('windowCount').textContent = profile.windowCount;
      
      // Create blob and download
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // 生成友好文件名：保存了X个标签-年月日-时分秒.html
      const tabCount = tabs.length;
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      const timestamp = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
      const filename = `保存了${tabCount}个标签-${timestamp}.html`;
      
      // 控制保存对话框行为
      const useDefaultPath = true; // 设为true将使用浏览器默认路径，不显示对话框
      
      await chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: !useDefaultPath // saveAs为false时，不显示保存对话框
      });
      
      status.textContent = `成功保存了 ${tabCount} 个标签!`;
      
      // 5秒后重置状态文本
      setTimeout(() => {
        status.textContent = '';
      }, 5000);
    } catch (error) {
      status.textContent = '保存标签页出错: ' + error.message;
    }
  });