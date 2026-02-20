// settings.js - 分组规则设置页面逻辑

const STORAGE_KEY = 'tabGroupingRules';
let selectedColor = 'blue';
let editingIndex = -1; // -1表示添加模式,>=0表示编辑模式

// Chrome API 支持的颜色名称（这9个是固定的，不能用其他值）
const VALID_COLORS = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];

// 颜色映射 - 从标签自动分组扩展中提取的颜色值
const colorMap = {
    'grey': '#5f6369',
    'blue': '#1974e8',
    'red': '#da3025',
    'yellow': '#f9ab04',
    'green': '#198139',
    'pink': '#d01984',
    'purple': '#a143f5',
    'cyan': '#027b84',
    'orange': '#fa913e'
};

// 初始化颜色选择器
function initColorPicker() {
    const colorOptions = document.querySelectorAll('.color-option');
    
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedColor = option.dataset.color;
            console.log('Selected color:', selectedColor);
        });
    });
    
    // 默认选中blue
    const defaultOption = document.querySelector('.color-option[data-color="blue"]');
    if (defaultOption) {
        defaultOption.classList.add('selected');
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
        let rules = result[STORAGE_KEY] || [];
        
        // 清理无效的颜色值
        let needsUpdate = false;
        rules = rules.map(rule => {
            if (!VALID_COLORS.includes(rule.color)) {
                console.warn('Invalid color found:', rule.color, 'replacing with grey');
                needsUpdate = true;
                return { ...rule, color: 'grey' };
            }
            return rule;
        });
        
        // 如果有无效颜色，保存清理后的数据
        if (needsUpdate) {
            chrome.storage.sync.set({ [STORAGE_KEY]: rules }, () => {
                console.log('Cleaned up invalid colors');
            });
        }
        
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
                    <span style="font-weight: 500;">#${ruleIndex + 1}</span>
                    <span>${rule.name}</span>
                </div>
                <div class="rule-actions">
                    <button class="button move-up-btn" data-index="${ruleIndex}" 
                            style="padding: 6px 10px; font-size: 12px; background: #607D8B;" 
                            ${ruleIndex === 0 ? 'disabled' : ''}>
                        ↑ 上移
                    </button>
                    <button class="button move-down-btn" data-index="${ruleIndex}" 
                            style="padding: 6px 10px; font-size: 12px; background: #607D8B;" 
                            ${ruleIndex === rules.length - 1 ? 'disabled' : ''}>
                        ↓ 下移
                    </button>
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
    
    // 添加上移按钮事件监听器
    document.querySelectorAll('.move-up-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            moveRule(index, -1);
        });
    });
    
    // 添加下移按钮事件监听器
    document.querySelectorAll('.move-down-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            moveRule(index, 1);
        });
    });
    
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
    console.log('addRule function called, editingIndex:', editingIndex);
    
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
        color: selectedColor  // 确保使用的是颜色名称字符串，不是十六进制值
    };
    
    // 验证颜色值
    if (!VALID_COLORS.includes(selectedColor)) {
        console.warn('Invalid color:', selectedColor, 'defaulting to grey');
        newRule.color = 'grey';
    }
    
    console.log('Creating new rule:', newRule);
    
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
        if (chrome.runtime.lastError) {
            console.error('Error getting storage:', chrome.runtime.lastError);
            showStatus('读取存储失败: ' + chrome.runtime.lastError.message, 'error');
            return;
        }
        
        const rules = result[STORAGE_KEY] || [];
        console.log('Current rules:', rules);
        
        if (editingIndex >= 0) {
            // 编辑模式:替换原位置的规则
            rules[editingIndex] = newRule;
            console.log('Updated rule at index:', editingIndex);
        } else {
            // 添加模式:添加到最后
            rules.push(newRule);
            console.log('Added new rule');
        }
        
        console.log('Updated rules:', rules);
        
        chrome.storage.sync.set({ [STORAGE_KEY]: rules }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving storage:', chrome.runtime.lastError);
                showStatus('保存失败: ' + chrome.runtime.lastError.message, 'error');
                return;
            }
            
            console.log('Rule saved successfully');
            showStatus(editingIndex >= 0 ? '规则修改成功！' : '规则添加成功！', 'success');
            loadRules();
            clearForm();
        });
    });
}

// 移动规则
function moveRule(index, direction) {
    console.log('moveRule called with index:', index, 'direction:', direction);
    
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
        if (chrome.runtime.lastError) {
            console.error('Error getting storage:', chrome.runtime.lastError);
            return;
        }
        
        const rules = result[STORAGE_KEY] || [];
        const newIndex = index + direction;
        
        // 检查边界
        if (newIndex < 0 || newIndex >= rules.length) {
            return;
        }
        
        // 交换位置
        [rules[index], rules[newIndex]] = [rules[newIndex], rules[index]];
        
        chrome.storage.sync.set({ [STORAGE_KEY]: rules }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving storage:', chrome.runtime.lastError);
                showStatus('移动失败: ' + chrome.runtime.lastError.message, 'error');
                return;
            }
            
            console.log('Rule moved successfully');
            showStatus('规则顺序已更新', 'success');
            loadRules();
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
        
        // 设置编辑模式
        editingIndex = index;
        
        // 填充表单
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
        
        // 确保选中的颜色是有效的
        if (!VALID_COLORS.includes(selectedColor)) {
            console.warn('Invalid color in rule:', selectedColor, 'defaulting to blue');
            selectedColor = 'blue';
            const defaultOption = document.querySelector('.color-option[data-color="blue"]');
            if (defaultOption) {
                defaultOption.classList.add('selected');
            }
        }
        
        // 修改按钮文字
        const addButton = document.getElementById('addRuleButton');
        if (addButton) {
            addButton.innerHTML = '✓ 确认修改';
            addButton.style.background = '#FF9800';
        }
        
        // 滚动到表单
        document.querySelector('.add-rule-form').scrollIntoView({ behavior: 'smooth' });
    });
}

// 清空表单
function clearForm() {
    console.log('Clearing form');
    document.getElementById('ruleName').value = '';
    document.getElementById('rulePatterns').value = '';
    
    // 重置为添加模式
    editingIndex = -1;
    
    // 恢复按钮文字
    const addButton = document.getElementById('addRuleButton');
    if (addButton) {
        addButton.innerHTML = '✓ 添加规则';
        addButton.style.background = '#4CAF50';
    }
    
    // 重置颜色选择
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
    });
    const defaultOption = document.querySelector('.color-option[data-color="blue"]');
    if (defaultOption) {
        defaultOption.classList.add('selected');
    }
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
    
    // 导出配置按钮
    const exportButton = document.getElementById('exportButton');
    if (exportButton) {
        exportButton.addEventListener('click', exportConfig);
    }
    
    // 导入配置按钮
    const importButton = document.getElementById('importButton');
    if (importButton) {
        importButton.addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
    }
    
    // 导入文件选择
    const importFile = document.getElementById('importFile');
    if (importFile) {
        importFile.addEventListener('change', importConfig);
    }
    
    // 关闭按钮
    const closeButton = document.getElementById('closeButton');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            window.close();
        });
    }
    
    // 清空规则按钮
    const clearButton = document.getElementById('clearButton');
    if (clearButton) {
        clearButton.addEventListener('click', clearAllRules);
    }
});


// 导出配置
function exportConfig() {
    console.log('Export config clicked');
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
        const rules = result[STORAGE_KEY] || [];
        console.log('Rules to export:', rules);
        
        if (rules.length === 0) {
            alert('没有规则可以导出！');
            return;
        }
        
        const config = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            rules: rules
        };
        
        const jsonStr = JSON.stringify(config, null, 2);
        
        // 使用data URL代替blob URL（避免CSP问题）
        const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonStr);
        
        const filename = 'tab-grouping-rules-' + new Date().toISOString().slice(0, 10) + '.json';
        
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        
        // 触发下载
        a.click();
        
        // 延迟清理
        setTimeout(() => {
            document.body.removeChild(a);
        }, 100);
        
        showStatus('配置已导出！', 'success');
    });
};

// 导入配置
function importConfig(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const config = JSON.parse(e.target.result);
            
            // 验证配置格式
            if (!config.rules || !Array.isArray(config.rules)) {
                throw new Error('无效的配置文件格式');
            }
            
            // 验证每个规则的格式
            for (const rule of config.rules) {
                if (!rule.name || !rule.patterns || !Array.isArray(rule.patterns)) {
                    throw new Error('配置文件中包含无效的规则');
                }
            }
            
            // 询问是否覆盖现有配置
            chrome.storage.sync.get([STORAGE_KEY], (result) => {
                const existingRules = result[STORAGE_KEY] || [];
                
                let message = '将导入 ' + config.rules.length + ' 条规则。';
                if (existingRules.length > 0) {
                    message += '\n\n当前有 ' + existingRules.length + ' 条规则，导入后将被替换。';
                }
                message += '\n\n确定要导入吗？';
                
                if (confirm(message)) {
                    chrome.storage.sync.set({ [STORAGE_KEY]: config.rules }, () => {
                        if (chrome.runtime.lastError) {
                            showStatus('导入失败: ' + chrome.runtime.lastError.message, 'error');
                        } else {
                            showStatus('成功导入 ' + config.rules.length + ' 条规则！', 'success');
                            loadRules();
                        }
                    });
                }
            });
            
        } catch (error) {
            showStatus('导入失败: ' + error.message, 'error');
        }
    };
    
    reader.readAsText(file);
    
    // 重置文件输入，允许重复导入同一文件
    event.target.value = '';
};


// 清空所有规则
function clearAllRules() {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
        const rules = result[STORAGE_KEY] || [];
        
        if (rules.length === 0) {
            alert('当前没有规则！');
            return;
        }
        
        if (confirm('确定要清空所有 ' + rules.length + ' 条规则吗？\n\n此操作不可恢复！')) {
            chrome.storage.sync.set({ [STORAGE_KEY]: [] }, () => {
                if (chrome.runtime.lastError) {
                    showStatus('清空失败: ' + chrome.runtime.lastError.message, 'error');
                } else {
                    showStatus('已清空所有规则！', 'success');
                    loadRules();
                }
            });
        }
    });
}
