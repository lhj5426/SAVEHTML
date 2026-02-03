// Update stats immediately when popup opens
async function updateStats() {
    try {
        const windows = await chrome.windows.getAll();
        const tabs = await chrome.tabs.query({});
        
        // Get tab groups
        const groups = await chrome.tabGroups.query({});
        
        document.getElementById('windowCount').textContent = windows.length;
        document.getElementById('tabCount').textContent = tabs.length;
        document.getElementById('groupCount').textContent = groups.length;
        
        // Display detailed group information
        const groupDetails = document.getElementById('groupDetails');
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
            
            const groupDetailsHTML = groups.map(group => {
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
            
            groupDetails.innerHTML = groupDetailsHTML;
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

// Initialize when popup opens
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
});