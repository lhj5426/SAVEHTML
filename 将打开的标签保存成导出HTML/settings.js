// settings.js - 分组规则设置页面逻辑

const STORAGE_KEY = 'tabGroupingRules';
let selectedColor = 'blue';

// 颜色映射
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

// 初始化颜色选择器
function initColorPicker() {
    const colorOptions = document.querySelectorAll('.color-option');
    
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedColor = option.dataset.color;
        });
    });
    
    // 默认选中第一个
    if (colorOptions.length > 0) {
        colorOptions[0].classList.add('selected');
    }
}

// 加载规则
function loadRules() {
    console.log('Loading rules...');
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
        if (chrome.runtime.lastError) {
            console.error('Error loading rules:', chrome.runtime.lastError);
            return;
        }
        const rules = result[STORAGE_KEY] || [];
        console.log('Loaded rules:', rules);
        displayRules(rules);
    });
}

// 显示规则列表
function displayRules(rules) {
    console.log('Displaying rules:', rules.length);
    const rulesList = document.getElementById('rulesList');
    
    if (!rulesList) {
        console.error('Rules list element not found!');
        return;
    }
    
    if (rules.length === 0) {
        rulesList.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>还没有添加任何分组规则</p>
                <p style="font-size: 14px; margin-top: 8px;">在上方添加你的第一个规则吧！</p>
            </div>
        `;
        return;
    }

    rulesList.innerHTML = rules.map((rule, ruleIndex) => `
        <div class="rule-item">
            <div class="rule-header">
                <div class="rule-name">
                    <span class="color-indicator" style="background: ${colorMap[rule.color]};"></span>
                    <span>${rule.name}</span>
                </div>
                <div class="rule-actions">
                    <button class="button button-primary edit-btn" data-index="${ruleIndex}" style="padding: 6px 12px; font-size: 12px;">
                        编辑
                    </button>
                    <button class="button button-danger delete-btn" data-index="${ruleIndex}" style="padding: 6px 12px; font-size: 12px;">
                        删除规则
                    </button>
                </div>
            </div>
            <div class="rule-patterns">
                <strong style="font-size: 13px; color: #666;">匹配模式:</strong>
                ${rule.patterns.map((pattern, patternIndex) => `
                    <div class="pattern-item" style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                        <span style="flex: 1; word-break: break-all;">${pattern}</span>
                        <button class="button button-danger delete-pattern-btn" 
                                data-rule-index="${ruleIndex}" 
                                data-pattern-index="${patternIndex}"
                                style="padding: 4px 8px; font-size: 11px; flex-shrink: 0;">
                            ✕
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    // 添加编辑按钮事件监听器
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            editRule(index);
        });
    });
    
    // 添加删除规则按钮事件监听器
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            deleteRule(index);
        });
    });
    
    // 添加删除单个模式按钮事件监听器
    document.querySelectorAll('.delete-pattern-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ruleIndex = parseInt(e.target.dataset.ruleIndex);
            const patternIndex = parseInt(e.target.dataset.patternIndex);
            deletePattern(ruleIndex, patternIndex);
        });
    });
}

// 添加规则
function addRule() {
    console.log('addRule function called');
    
    const nameInput = document.getElementById('ruleName');
    const patternsInput = document.getElementById('rulePatterns');
    
    if (!nameInput || !patternsInput) {
        console.error('Input elements not found!');
        showStatus('页面元素未找到', 'error');
        return;
    }
    
    const name = nameInput.value.trim();
    const patternsText = patternsInput.value.trim();
    
    console.log('Name:', name);
    console.log('Patterns:', patternsText);
    console.log('Selected color:', selectedColor);
    
    if (!name) {
        showStatus('请输入规则名称', 'error');
        return;
    }
    
    if (!patternsText) {
        showStatus('请输入至少一个匹配模式', 'error');
        return;
    }
    
    const patterns = patternsText.split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);
    
    console.log('Parsed patterns:', patterns);
    
    if (patterns.length === 0) {
        showStatus('请输入有效的匹配模式', 'error');
        return;
    }
    
    const newRule = {
        name: name,
        patterns: patterns,
        color: selectedColor
    };
    
    console.log('Creating new rule:', newRule);
    
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
        if (chrome.runtime.lastError) {
            console.error('Error getting storage:', chrome.runtime.lastError);
            showStatus('读取存储失败: ' + chrome.runtime.lastError.message, 'error');
            return;
        }
        
        const rules = result[STORAGE_KEY] || [];
        console.log('Current rules:', rules);
        
        rules.push(newRule);
        console.log('Updated rules:', rules);
        
        chrome.storage.sync.set({ [STORAGE_KEY]: rules }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving storage:', chrome.runtime.lastError);
                showStatus('保存失败: ' + chrome.runtime.lastError.message, 'error');
                return;
            }
            
            console.log('Rule saved successfully');
            showStatus('规则添加成功！', 'success');
            loadRules();
            clearForm();
        });
    });
}

// 删除规则
function deleteRule(index) {
    console.log('deleteRule called with index:', index);
    
    if (!confirm('确定要删除这个规则吗？')) {
        return;
    }
    
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
        if (chrome.runtime.lastError) {
            console.error('Error getting storage:', chrome.runtime.lastError);
            return;
        }
        
        const rules = result[STORAGE_KEY] || [];
        rules.splice(index, 1);
        
        chrome.storage.sync.set({ [STORAGE_KEY]: rules }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving storage:', chrome.runtime.lastError);
                showStatus('删除失败: ' + chrome.runtime.lastError.message, 'error');
                return;
            }
            
            console.log('Rule deleted successfully');
            showStatus('规则已删除', 'success');
            loadRules();
        });
    });
}

// 删除单个匹配模式
function deletePattern(ruleIndex, patternIndex) {
    console.log('deletePattern called:', ruleIndex, patternIndex);
    
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
        if (chrome.runtime.lastError) {
            console.error('Error getting storage:', chrome.runtime.lastError);
            return;
        }
        
        const rules = result[STORAGE_KEY] || [];
        const rule = rules[ruleIndex];
        
        if (!rule) {
            console.error('Rule not found at index:', ruleIndex);
            return;
        }
        
        // 如果只有一个模式，提示用户删除整个规则
        if (rule.patterns.length === 1) {
            if (confirm('这是该规则的最后一个匹配模式，删除后将删除整个规则。确定要删除吗？')) {
                rules.splice(ruleIndex, 1);
            } else {
                return;
            }
        } else {
            // 删除指定的模式
            rule.patterns.splice(patternIndex, 1);
        }
        
        chrome.storage.sync.set({ [STORAGE_KEY]: rules }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving storage:', chrome.runtime.lastError);
                showStatus('删除失败: ' + chrome.runtime.lastError.message, 'error');
                return;
            }
            
            console.log('Pattern deleted successfully');
            showStatus('匹配模式已删除', 'success');
            loadRules();
        });
    });
}

// 编辑规则
function editRule(index) {
    console.log('editRule called with index:', index);
    
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
        if (chrome.runtime.lastError) {
            console.error('Error getting storage:', chrome.runtime.lastError);
            return;
        }
        
        const rules = result[STORAGE_KEY] || [];
        const rule = rules[index];
        
        if (!rule) {
            console.error('Rule not found at index:', index);
            return;
        }
        
        console.log('Editing rule:', rule);
        
        document.getElementById('ruleName').value = rule.name;
        document.getElementById('rulePatterns').value = rule.patterns.join('\n');
        
        // 选中对应的颜色
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.color === rule.color) {
                option.classList.add('selected');
                selectedColor = rule.color;
            }
        });
        
        // 删除旧规则
        rules.splice(index, 1);
        chrome.storage.sync.set({ [STORAGE_KEY]: rules }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving storage:', chrome.runtime.lastError);
                return;
            }
            loadRules();
        });
        
        // 滚动到表单
        document.querySelector('.add-rule-form').scrollIntoView({ behavior: 'smooth' });
    });
}

// 清空表单
function clearForm() {
    console.log('Clearing form');
    document.getElementById('ruleName').value = '';
    document.getElementById('rulePatterns').value = '';
    document.querySelectorAll('.color-option').forEach((opt, idx) => {
        opt.classList.remove('selected');
        if (idx === 0) opt.classList.add('selected');
    });
    selectedColor = 'blue';
}

// 显示状态消息
function showStatus(message, type) {
    console.log('Status:', type, message);
    const statusEl = document.getElementById('statusMessage');
    
    if (!statusEl) {
        console.error('Status message element not found!');
        alert(message);
        return;
    }
    
    statusEl.textContent = message;
    statusEl.className = `status-message status-${type}`;
    statusEl.style.display = 'block';
    
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 3000);
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 加载规则
    loadRules();
    
    // 初始化颜色选择器
    initColorPicker();
    
    // 添加按钮事件监听
    const addButton = document.getElementById('addRuleButton');
    if (addButton) {
        addButton.addEventListener('click', (e) => {
            e.preventDefault();
            addRule();
        });
    }
});
