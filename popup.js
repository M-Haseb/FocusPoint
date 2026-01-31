document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('channelInput');
    const addBtn = document.getElementById('addBtn');
    const list = document.getElementById('channelList');
    const emptyState = document.getElementById('emptyState');

    // Load channels on startup
    loadChannels();

    // Event Listeners
    addBtn.addEventListener('click', addChannel);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addChannel();
    });

    function addChannel() {
        const channelName = input.value.trim();
        
        if (!channelName) return;

        chrome.storage.sync.get(['whitelistedChannels'], (result) => {
            const channels = result.whitelistedChannels || [];
            
            // Avoid duplicates
            if (!channels.includes(channelName)) {
                channels.push(channelName);
                chrome.storage.sync.set({ whitelistedChannels: channels }, () => {
                    input.value = '';
                    renderList(channels);
                });
            } else {
                alert('Channel already in whitelist!');
            }
        });
    }

    function removeChannel(name) {
        chrome.storage.sync.get(['whitelistedChannels'], (result) => {
            const channels = result.whitelistedChannels || [];
            const newChannels = channels.filter(c => c !== name);
            
            chrome.storage.sync.set({ whitelistedChannels: newChannels }, () => {
                renderList(newChannels);
            });
        });
    }

    function loadChannels() {
        chrome.storage.sync.get(['whitelistedChannels'], (result) => {
            renderList(result.whitelistedChannels || []);
        });
    }

    function renderList(channels) {
        list.innerHTML = '';
        
        if (channels.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            
            channels.forEach(name => {
                const li = document.createElement('li');
                li.textContent = name;
                
                const removeBtn = document.createElement('button');
                removeBtn.textContent = '✖';
                removeBtn.className = 'remove-btn';
                removeBtn.title = 'Remove channel';
                removeBtn.onclick = () => removeChannel(name);
                
                li.appendChild(removeBtn);
                list.appendChild(li);
            });
        }
    }
});