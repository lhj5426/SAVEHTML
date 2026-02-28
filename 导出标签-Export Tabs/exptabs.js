var targetWindow = null;
var tabCount = 0;

async function start() {
  const win = await chrome.windows.getCurrent();
  getWindows(win);
}

async function getWindows(win) {
  targetWindow = win;
  chrome.tabs.query({ windowId: targetWindow.id }, getTabs);
}

async function getTabs(tabs) {
  tabCount = tabs.length;
  chrome.windows.getAll({ "populate": true }, expTabs);
}

function expTabs(windows) {
  var numWindows = windows.length;
  var exportAll = document.getElementById('inclAll').checked == true ? 1 : 0;
  document.getElementById('content').value = '';
  for (var i = 0; i < numWindows; i++) {
    var win = windows[i];
    if (targetWindow.id == win.id || exportAll == 1) {
      var numTabs = win.tabs.length;
      for (var j = 0; j < numTabs; j++) {
        var tab = win.tabs[j];
        if (document.getElementById('inclTitle').checked == true) {
          document.getElementById('content').value += tab.title + '\n';
        }
        document.getElementById('content').value += tab.url + '\n\n';
      }
    }
  }
}

function openTabs() {
  var content = document.getElementById('content').value;
  var rExp = new RegExp(
    "(^|[ \t\r\n])((ftp|http|https|news|file|view-source|chrome):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-])*)"
    , "g"
  );
  var newTabs = content.match(rExp);
  if (newTabs != null) {
    var newTabsLen = newTabs.length;
    for (var j = 0; j < newTabsLen; j++) {
      var nt = newTabs[j];
      chrome.tabs.create({ url: nt, active: false });
    }
  } else {
    alert('Only fully qualified URLs will be opened.');
  }
}

function sendMail(gm) {
  var action_url = "mailto:?";
  //action_url += "subject=" + encodeURIComponent(subject) + "&";
  action_url += "body=" + encodeURIComponent(document.getElementById('content').value);
  if (gm == 1) {
    var custom_url = "https://mail.google.com/mail/?extsrc=mailto&url=%s";
    action_url = custom_url.replace("%s", encodeURIComponent(action_url));
    chrome.tabs.create({ url: action_url });
  } else {
    chrome.tabs.update(null, { url: action_url });
  }
}

// --- Ported Advanced HTML Generation ---

function getSVGIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
      <rect x="0" y="0" width="128" height="128" rx="24" fill="#FF6B6B"/>
      <path d="M16 16 L112 16 L112 112 L64 94 L16 112 Z" fill="white"/>
      <g transform="translate(26, 30)">
        <rect x="0" y="44" width="76" height="14" rx="3" fill="#FF6B6B" opacity="0.4"/>
        <rect x="0" y="22" width="76" height="14" rx="3" fill="#FF6B6B" opacity="0.7"/>
        <rect x="0" y="0" width="76" height="14" rx="3" fill="#FF6B6B"/>
      </g>
    </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg.trim())}`;
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
    return await chrome.tabGroups.query({});
  } catch (e) { return []; }
}

async function getGroupingRules() {
  try {
    const result = await chrome.storage.sync.get(['tabGroupingRules']);
    return result.tabGroupingRules || [];
  } catch (e) { return []; }
}

function getBaseDomain(url) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    const parts = hostname.split('.');
    return parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
  } catch { return 'unknown'; }
}

function decodeUrlIfNeeded(url) {
  try {
    let decodedUrl = decodeURI(url);
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
    return decodedUrl !== url ? decodedUrl : null;
  } catch { return null; }
}

function sortTabs(tabs, sortBy = 'lastAccessed', ascending = false) {
  return [...tabs].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'lastAccessed':
        const dateA = a.lastAccessed || 0;
        const dateB = b.lastAccessed || 0;
        comparison = dateB - dateA;
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
    if (!groups[domain]) groups[domain] = [];
    groups[domain].push(tab);
  });
  return Object.keys(groups).sort().reduce((acc, domain) => {
    acc[domain] = sortTabs(groups[domain], 'lastAccessed', false);
    return acc;
  }, {});
}

function getGroupColor(colorName) {
  const colorMap = { 'grey': '#5F6368', 'blue': '#1A73E8', 'red': '#D93025', 'yellow': '#F9AB00', 'green': '#1E8E3E', 'pink': '#D01884', 'purple': '#9334E6', 'cyan': '#12B5CB', 'orange': '#FA903E' };
  return colorMap[colorName] || colorMap['grey'];
}

function generateTabEntry(tab, index = null) {
  const decodedUrl = decodeUrlIfNeeded(tab.url);
  const decodedUrlHtml = decodedUrl ? `<div class="tab-decoded-url">URL解码: ${decodedUrl}</div>` : '';
  const indexHtml = index !== null ? `<span class="tab-index">${index}</span>` : '';
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
          <div class="visit-info"><span class="visit-time"></span><span class="visit-count"></span></div>
          <div class="tab-markers">
            <label class="marker-checkbox marker-downloaded">
              <input type="checkbox" class="marker-downloaded-cb" onchange="window.saveMarker(this, 'downloaded')">
              <span>✓ 已下载</span>
            </label>
            <label class="marker-checkbox marker-skipped">
              <input type="checkbox" class="marker-skipped-cb" onchange="window.saveMarker(this, 'skipped')">
              <span>✗ 未下载</span>
            </label>
          </div>
        </div>
      </div>`;
}

function generateHTML(tabs, profile, tabGroups = [], groupingRules = []) {
  const date = new Date().toLocaleString();
  const tabCount = tabs.length;
  const tabsByLastAccessed = sortTabs(tabs, 'lastAccessed', false);
  const tabsByTitle = sortTabs(tabs, 'title', true);
  const tabsByUrl = sortTabs(tabs, 'url', true);
  const groupedTabsByDomain = groupTabsByDomain(tabs);

  const groupInfoMap = {};
  tabGroups.forEach(group => {
    groupInfoMap[group.id] = { title: group.title || '未命名组', color: group.color || 'grey' };
  });

  const tabGroupsData = {};
  const ungroupedTabs = [];
  tabs.forEach(tab => {
    if (tab.groupId && tab.groupId !== -1) {
      if (!tabGroupsData[tab.groupId]) {
        const info = groupInfoMap[tab.groupId] || { title: '未命名组', color: 'grey' };
        tabGroupsData[tab.groupId] = { tabs: [], color: info.color, title: info.title };
      }
      tabGroupsData[tab.groupId].tabs.push(tab);
    } else {
      ungroupedTabs.push(tab);
    }
  });

  const tabGroupsHTML = Object.entries(tabGroupsData).map(([id, data]) => `
      <div class="tab-group">
        <div class="group-header" onclick="window.toggleGroup(this)">
          <span class="group-header-title">
            <input type="checkbox" class="group-select-checkbox" onclick="window.toggleGroupSelection(this)">
            <span class="group-color-indicator" style="background-color: ${getGroupColor(data.color)}"></span>
            ${data.title} 【共有${data.tabs.length}个标签】
          </span>
          <span class="toggle-icon">▾</span>
        </div>
        <div class="group-content">${data.tabs.map((t, i) => generateTabEntry(t, i + 1)).join('')}</div>
      </div>`).join('');

  const ungroupedHTML = ungroupedTabs.length > 0 ? `
      <div class="tab-group">
        <div class="group-header" onclick="window.toggleGroup(this)">
          <span class="group-header-title">
            <input type="checkbox" class="group-select-checkbox" onclick="window.toggleGroupSelection(this)">
            未分组标签 【共有${ungroupedTabs.length}个标签】
          </span>
          <span class="toggle-icon">▾</span>
        </div>
        <div class="group-content">${ungroupedTabs.map((t, i) => generateTabEntry(t, i + 1)).join('')}</div>
      </div>` : '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Saved Tabs - ${date}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px 20px 20px 210px; background: #f5f5f5; }
      .static-header { background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .sticky-controls { position: sticky; top: 15px; z-index: 1000; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); padding: 15px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); display: flex; align-items: center; flex-wrap: wrap; gap: 15px; }
      .button-group { display: flex; flex-wrap: wrap; gap: 10px; }
      .button { padding: 8px 16px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
      .search-container { flex-grow: 1; min-width: 200px; }
      .search-input { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; }
      .view-controls { position: fixed; left: 20px; top: 20px; width: 150px; z-index: 999; background: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); display: flex; flex-direction: column; gap: 10px; }
      .view-button { padding: 10px 12px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer; font-size: 13px; }
      .view-button.active { background: #2196F3; color: white; border-color: #2196F3; }
      .tabs-container { background: #fff; padding: 20px; border-radius: 8px; }
      .tab-entry { padding: 15px; border-bottom: 1px solid #eee; display: flex; align-items: flex-start; gap: 12px; transition: background 0.2s; }
      .tab-entry.selected { background: #e3f2fd; }
      .tab-entry.hidden { display: none; }
      .tab-index { min-width: 30px; text-align: right; font-weight: bold; color: #666; font-size: 14px; }
      .tab-icon { width: 16px; height: 16px; border-radius: 3px; margin-top: 2px; }
      .tab-content { flex-grow: 1; min-width: 0; }
      .tab-title { color: #2196F3; text-decoration: none; font-weight: 500; display: block; margin-bottom: 5px; word-break: break-word; background: #E8F5E9; padding: 4px 8px; border-radius: 4px; }
      .tab-url { color: #666; font-size: 0.85em; word-break: break-all; max-height: 0; overflow: hidden; transition: max-height 0.3s; background: #FFEBEE; padding: 0 8px; border-radius: 4px; }
      .tab-url.expanded { max-height: 500px; margin-top: 4px; padding: 6px 8px; }
      .tab-url-toggle { color: #2196F3; font-size: 0.85em; cursor: pointer; user-select: none; }
      .tab-decoded-url { color: #1976D2; font-size: 0.85em; word-break: break-all; margin-top: 4px; background: #E3F2FD; padding: 6px 8px; border-radius: 4px; }
      .visit-info { display: flex; gap: 15px; font-size: 0.8em; margin-top: 6px; font-style: italic; }
      .tab-group { margin-bottom: 20px; }
      .group-header { font-size: 1.1em; font-weight: 500; color: #666; padding: 10px; background: #f5f5f5; border-radius: 4px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
      .group-header-title { display: flex; align-items: center; gap: 8px; }
      .group-color-indicator { width: 12px; height: 12px; border-radius: 50%; }
      .toggle-icon { transition: transform 0.2s; }
      .collapsed .toggle-icon { transform: rotate(-90deg); }
      .group-content.collapsed { max-height: 0; overflow: hidden; }
      .views > div { display: none; }
      .views > div.active { display: block; }
      .tab-markers { display: flex; gap: 8px; margin-top: 8px; }
      .marker-checkbox { cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 4px; }
      .marker-checkbox:hover { background-color: #f0f0f0; }
      .marker-downloaded { color: #4CAF50; font-weight: 500; }
      .marker-skipped { color: #F44336; font-weight: 500; }
      /* Rainbow colors for visit counts */
      .visit-info.visited-count-1 { color: #E53935 !important; } .visit-info.visited-count-2 { color: #FB8C00 !important; }
      .visit-info.visited-count-3 { color: #FDD835 !important; } .visit-info.visited-count-4 { color: #43A047 !important; }
      .visit-info.visited-count-5 { color: #00ACC1 !important; } .visit-info.visited-count-6 { color: #1E88E5 !important; }
      .visit-info.visited-count-7 { color: #5E35B1 !important; }
      .empty-state { text-align: center; padding: 40px; color: #666; }
    </style></head><body>
    <div class="static-header"><div class="stats"><strong>总标签数:</strong> ${tabCount} | <strong>标签组数:</strong> ${Object.keys(tabGroupsData).length} | <strong>保存时间:</strong> ${date}</div></div>
    <div class="sticky-controls">
      <div class="button-group">
        <button class="button" onclick="window.openTabsBySelector('.tab-entry')">打开全部标签</button>
        <button class="button" onclick="window.openTabsBySelector('.views > .active .tab-entry:not(.hidden)')">打开过滤后的标签</button>
        <button class="button" id="openSelectedButton" onclick="window.openTabsBySelector('.tab-checkbox:checked')" disabled>打开选中的标签</button>
        <button class="button" style="background:#2196F3" onclick="window.toggleAllGroups()">展开全部分组</button>
        <button class="button" style="background:#FF9800" onclick="window.toggleAllUrls()">一键展开所有URL</button>
        <button class="button" style="background:#9C27B0" onclick="window.clearMarkers()">清除下载标记</button>
        <button class="button" style="background:#F44336" onclick="window.clearVisitHistory()">清除访问历史</button>
      </div>
      <div class="search-container"><input type="text" class="search-input" placeholder="搜索..." oninput="window.searchTabs(this.value)"></div>
    </div>
    <div class="view-controls">
      <button class="view-button active" data-view="recent">最新</button>
      <button class="view-button" data-view="alphabetical">按字母顺序</button>
      <button class="view-button" data-view="url">按网址</button>
      <button class="view-button" data-view="byTabGroup">按标签组</button>
      <button class="view-button" data-view="byRulesUnvisited">按未访问排序</button>
      <button class="view-button" data-view="grouped">按域名分组</button>
    </div>
    <div class="views">
      <div class="tabs-container active" id="recent">${tabsByLastAccessed.map((t, i) => generateTabEntry(t, i + 1)).join('')}</div>
      <div class="tabs-container" id="alphabetical">${tabsByTitle.map((t, i) => generateTabEntry(t, i + 1)).join('')}</div>
      <div class="tabs-container" id="url">${tabsByUrl.map((t, i) => generateTabEntry(t, i + 1)).join('')}</div>
      <div class="tabs-container" id="byTabGroup">${tabGroupsHTML}${ungroupedHTML}</div>
      <div class="tabs-container" id="byRulesUnvisited"></div>
      <div class="tabs-container" id="grouped">
        ${Object.entries(groupedTabsByDomain).map(([domain, dTabs]) => `
          <div class="tab-group">
            <div class="group-header" onclick="window.toggleGroup(this)">
              <span class="group-header-title"><input type="checkbox" class="group-select-checkbox" onclick="window.toggleGroupSelection(this)">${domain} 【当前域名共有${dTabs.length}个标签】</span>
              <span class="toggle-icon">▾</span>
            </div>
            <div class="group-content">${dTabs.map((t, i) => generateTabEntry(t, i + 1)).join('')}</div>
          </div>`).join('')}
      </div>
    </div>
    <script>
      const STORAGE_KEY = 'tabSaverVisitedLinks';
      const MARKERS_STORAGE_KEY = 'tabSaverMarkers';
      const ALL_TABS_DATA = ${JSON.stringify(tabs.map(t => ({ url: t.url, title: t.title, favIconUrl: t.favIconUrl, groupId: t.groupId })))};
      const GROUPS_INFO = ${JSON.stringify(groupInfoMap)};

      const getVisitedLinks = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const getMarkers = () => JSON.parse(localStorage.getItem(MARKERS_STORAGE_KEY) || '{}');
      
      window.recordVisit = (el) => {
        const url = el.dataset.url;
        const visited = getVisitedLinks();
        const data = visited[url] || { count: 0 };
        data.count++;
        data.lastVisited = new Date().toISOString();
        visited[url] = data;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(visited));
        updateVisitInfo(el, data);
      };
      
      const updateVisitInfo = (el, data) => {
        const timeEl = el.querySelector('.visit-time');
        const countEl = el.querySelector('.visit-count');
        const info = el.querySelector('.visit-info');
        if (timeEl) timeEl.textContent = '上次访问: ' + new Date(data.lastVisited).toLocaleString();
        if (countEl) countEl.textContent = '访问 ' + data.count + ' 次';
        if (info) {
          for (let i = 1; i <= 7; i++) info.classList.remove('visited-count-' + i);
          info.classList.add('visited-count-' + (((data.count - 1) % 7) + 1));
        }
      };

      window.handleLinkClick = (e) => { if (e.button <= 1) window.recordVisit(e.currentTarget.closest('.tab-entry')); };
      
      window.saveMarker = (cb, type) => {
        const tabEntry = cb.closest('.tab-entry');
        const url = tabEntry.dataset.url;
        const markers = getMarkers();
        if (!markers[url]) markers[url] = {};
        
        if (cb.checked) {
          const otherType = type === 'downloaded' ? 'skipped' : 'downloaded';
          const otherCb = tabEntry.querySelector(type === 'downloaded' ? '.marker-skipped-cb' : '.marker-downloaded-cb');
          if (otherCb) {
            otherCb.checked = false;
            markers[url][otherType] = false;
          }
        }
        
        markers[url][type] = cb.checked;
        localStorage.setItem(MARKERS_STORAGE_KEY, JSON.stringify(markers));
      };

      window.clearMarkers = () => {
        if (confirm('确定要清除所有下载标记吗？')) {
          localStorage.removeItem(MARKERS_STORAGE_KEY);
          document.querySelectorAll('.marker-downloaded-cb, .marker-skipped-cb').forEach(c => c.checked = false);
        }
      };

      window.clearVisitHistory = () => {
        if (confirm('确定要清除访问历史吗？')) {
          localStorage.removeItem(STORAGE_KEY);
          document.querySelectorAll('.visit-time, .visit-count').forEach(e => e.textContent = '');
          document.querySelectorAll('.visit-info').forEach(info => {
            for (let i = 1; i <= 7; i++) info.classList.remove('visited-count-' + i);
          });
          if (document.querySelector('.view-button[data-view="byRulesUnvisited"]').classList.contains('active')) {
             regenerateUnvisitedView();
          }
        }
      };

      window.toggleUrl = (el) => {
        const url = el.nextElementSibling;
        const expanding = url.classList.contains('collapsed');
        url.classList.toggle('collapsed', !expanding);
        url.classList.toggle('expanded', expanding);
        el.textContent = expanding ? '▼ 隐藏URL' : '▶ 显示URL';
      };

      window.toggleGroup = (el) => { el.classList.toggle('collapsed'); el.nextElementSibling.classList.toggle('collapsed'); };
      
      window.toggleGroupSelection = (cb) => {
        event.stopPropagation();
        cb.closest('.group-header').nextElementSibling.querySelectorAll('.tab-checkbox').forEach(c => {
          c.checked = cb.checked;
        });
        window.updateSelectionState();
      };

      window.updateSelectionState = () => {
        const totalSelected = document.querySelectorAll('.tab-checkbox:checked').length;
        const btn = document.getElementById('openSelectedButton');
        btn.disabled = totalSelected === 0;
        btn.textContent = totalSelected > 0 ? \`打开选中的 (\${totalSelected})\` : '打开选中的标签';
        document.querySelectorAll('.tab-checkbox').forEach(cb => cb.closest('.tab-entry').classList.toggle('selected', cb.checked));
      };

      window.searchTabs = (q) => {
        q = q.toLowerCase();
        const active = document.querySelector('.views > .active');
        active.querySelectorAll('.tab-entry').forEach(e => {
          const match = e.dataset.title.toLowerCase().includes(q) || e.dataset.url.toLowerCase().includes(q);
          e.classList.toggle('hidden', !match);
        });
        active.querySelectorAll('.tab-group').forEach(g => {
          const hasVisible = g.querySelectorAll('.tab-entry:not(.hidden)').length > 0;
          g.style.display = hasVisible ? '' : 'none';
        });
      };

      window.openTabsBySelector = (sel) => {
        const entries = sel === '.tab-checkbox:checked' ? Array.from(document.querySelectorAll(sel)).map(c => c.closest('.tab-entry')) : document.querySelectorAll(sel);
        entries.forEach(e => {
          if (!e.classList.contains('hidden')) {
            window.open(e.dataset.url, '_blank');
            window.recordVisit(e);
          }
        });
      };

      window.toggleAllUrls = () => {
        const expanding = !window.allUrlsExpanded;
        const active = document.querySelector('.views > .active');
        active.querySelectorAll('.tab-url').forEach(u => u.classList.toggle('expanded', expanding));
        active.querySelectorAll('.tab-url-toggle').forEach(t => t.textContent = expanding ? '▼ 隐藏URL' : '▶ 显示URL');
        window.allUrlsExpanded = expanding;
      };

      window.toggleAllGroups = () => {
        const active = document.querySelector('.views > .active');
        const headers = active.querySelectorAll('.group-header');
        const anyCollapsed = Array.from(headers).some(h => h.classList.contains('collapsed'));
        headers.forEach(h => {
          h.classList.toggle('collapsed', !anyCollapsed);
          h.nextElementSibling.classList.toggle('collapsed', !anyCollapsed);
        });
      };

      function generateTabEntryInternal(tab, i) {
        return \`<div class="tab-entry" data-url="\${tab.url}" data-title="\${tab.title || ''}">
          <span class="tab-index">\${i+1}</span>
          <input type="checkbox" class="tab-checkbox" onclick="window.updateSelectionState()">
          <img class="tab-icon" src="\${tab.favIconUrl || ''}" onerror="this.style.backgroundColor='#e0e0e0'">
          <div class="tab-content">
            <a href="\${tab.url}" class="tab-title" target="_blank" onmousedown="window.handleLinkClick(event)">\${tab.title || tab.url}</a>
            <div class="tab-url-container">
              <span class="tab-url-toggle" onclick="window.toggleUrl(this)">▶ 显示URL</span>
              <div class="tab-url collapsed">\${tab.url}</div>
            </div>
            <div class="visit-info"><span class="visit-time"></span><span class="visit-count"></span></div>
            <div class="tab-markers">
              <label class="marker-checkbox marker-downloaded"><input type="checkbox" class="marker-downloaded-cb" onchange="window.saveMarker(this, 'downloaded')"><span>✓ 已下载</span></label>
              <label class="marker-checkbox marker-skipped"><input type="checkbox" class="marker-skipped-cb" onchange="window.saveMarker(this, 'skipped')"><span>✗ 未下载</span></label>
            </div>
          </div>
        </div>\`;
      }

      function regenerateUnvisitedView() {
        const container = document.getElementById('byRulesUnvisited');
        const visited = getVisitedLinks();
        const unvisitedTabs = ALL_TABS_DATA.filter(t => !visited[t.url]);
        
        if (unvisitedTabs.length === 0) {
          container.innerHTML = '<div class="empty-state"><p>没有未访问的标签</p></div>';
          return;
        }

        const groups = {};
        const ungrouped = [];
        
        unvisitedTabs.forEach(tab => {
          if (tab.groupId && tab.groupId !== -1 && GROUPS_INFO[tab.groupId]) {
            if (!groups[tab.groupId]) groups[tab.groupId] = [];
            groups[tab.groupId].push(tab);
          } else {
            ungrouped.push(tab);
          }
        });

        const colorMap = { 'grey': '#5F6368', 'blue': '#1A73E8', 'red': '#D93025', 'yellow': '#F9AB00', 'green': '#1E8E3E', 'pink': '#D01884', 'purple': '#9334E6', 'cyan': '#12B5CB', 'orange': '#FA903E' };

        let html = '';
        Object.keys(groups).forEach(id => {
          const info = GROUPS_INFO[id];
          const color = colorMap[info.color] || colorMap['grey'];
          html += \`
            <div class="tab-group">
              <div class="group-header" onclick="window.toggleGroup(this)">
                <span class="group-header-title">
                  <input type="checkbox" class="group-select-checkbox" onclick="window.toggleGroupSelection(this)">
                  <span class="group-color-indicator" style="background-color: \${color}"></span>
                  \${info.title} 【共有\${groups[id].length}个标签】
                </span>
                <span class="toggle-icon">▾</span>
              </div>
              <div class="group-content">\${groups[id].map((t, i) => generateTabEntryInternal(t, i)).join('')}</div>
            </div>\`;
        });

        if (ungrouped.length > 0) {
          html += \`
            <div class="tab-group">
              <div class="group-header" onclick="window.toggleGroup(this)">
                <span class="group-header-title">
                  <input type="checkbox" class="group-select-checkbox" onclick="window.toggleGroupSelection(this)">
                  未分组标签 【共有\${ungrouped.length}个标签】
                </span>
                <span class="toggle-icon">▾</span>
              </div>
              <div class="group-content">\${ungrouped.map((t, i) => generateTabEntryInternal(t, i)).join('')}</div>
            </div>\`;
        }

        container.innerHTML = html;
        applyState(container);
      }

      function applyState(base = document) {
        const visited = getVisitedLinks();
        const markers = getMarkers();
        base.querySelectorAll('.tab-entry').forEach(e => {
          const url = e.dataset.url;
          if (visited[url]) updateVisitInfo(e, visited[url]);
          if (markers[url]) {
            if (markers[url].downloaded) e.querySelector('.marker-downloaded-cb').checked = true;
            if (markers[url].skipped) e.querySelector('.marker-skipped-cb').checked = true;
          }
        });
      }

      document.querySelectorAll('.view-button').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.view-button').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          document.querySelectorAll('.views > div').forEach(v => v.classList.remove('active'));
          const target = document.getElementById(btn.dataset.view);
          target.classList.add('active');
          if (btn.dataset.view === 'byRulesUnvisited') regenerateUnvisitedView();
          window.searchTabs('');
        });
      });

      document.addEventListener('DOMContentLoaded', () => { applyState(); });
    </script></body></html>`;
}

async function download() {
  const allTabs = await getAllTabs();
  const tabs = allTabs.filter(tab => {
    const url = tab.url.toLowerCase();
    return !url.startsWith('chrome://') && !url.startsWith('about:') && !url.startsWith('chrome-extension://');
  });

  const windowCount = (await chrome.windows.getAll()).length;
  const tabGroups = await getTabGroups();
  const groupingRules = await getGroupingRules();

  const html = generateHTML(tabs, { windowCount }, tabGroups, groupingRules);

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const date = new Date();
  const ts = date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0') + '-' + date.getHours().toString().padStart(2, '0') + date.getMinutes().toString().padStart(2, '0') + date.getSeconds().toString().padStart(2, '0');
  const filename = `保存了${tabs.length} 个标签 - ${ts}.html`;

  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: false
  });
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    if (document.querySelector('#btOpenTabs')) {
      document.querySelector('#btOpenTabs').addEventListener('click', openTabs);
    }
    if (document.querySelector('#inclTitle')) {
      document.querySelector('#inclTitle').addEventListener('click', start);
    }
    if (document.querySelector('#inclAll')) {
      document.querySelector('#inclAll').addEventListener('click', start);
    }
    if (document.querySelector('#sendMail0')) {
      document.querySelector('#sendMail0').addEventListener('click', () => sendMail(0));
    }
    if (document.querySelector('#sendMail1')) {
      document.querySelector('#sendMail1').addEventListener('click', () => sendMail(1));
    }
    if (document.querySelector('#download')) {
      document.querySelector('#download').addEventListener('click', () => {
        download().catch(err => {
          console.error('Download failed:', err);
          alert('下载失败: ' + err.message);
        });
      });
    }
    start();
  } catch (e) {
    console.error('Initialization error:', e);
  }
});


