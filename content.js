// Variable to store the current whitelist
let allowedChannels = [];

// Selectors for various YouTube video containers (Home, Search, Sidebar, Grid)
const VIDEO_SELECTORS = [
    'ytd-rich-item-renderer',           // Home page grid items
    'ytd-video-renderer',               // Search results
    'ytd-compact-video-renderer',       // Sidebar recommendations
    'ytd-grid-video-renderer'           // Channel page grid
];

// 1. Initialize: Load settings and start observing
function init() {
    // Listen for changes in storage so the content script updates immediately
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && changes.whitelistedChannels) {
            allowedChannels = changes.whitelistedChannels.newValue || [];
            console.log('FocusTube: Whitelist updated via storage change:', allowedChannels);
            runFilter();
        }
    });

    // Load channels on startup
    chrome.storage.sync.get(['whitelistedChannels'], (result) => {
        allowedChannels = result.whitelistedChannels || [];
        console.log('FocusTube: Loaded whitelist:', allowedChannels);
        runFilter();
    });

    // Observe DOM changes (Crucial for dynamically loaded YouTube content)
    const observer = new MutationObserver(() => {
        runFilter(); 
    });

    // Observe the main container that holds video content
    const targetNode = document.getElementById('contents') || document.body;
    observer.observe(targetNode, {
        childList: true,
        subtree: true
    });
}

// 2. Main Filter Function
function runFilter() {
    const selectorString = VIDEO_SELECTORS.join(',');
    const videos = document.querySelectorAll(selectorString);

    videos.forEach(video => {
        const channelName = extractChannelName(video);
        
        if (channelName) {
            // Check if the video's channel is in our whitelist (Case insensitive)
            const isAllowed = allowedChannels.some(allowed => 
                allowed.toLowerCase() === channelName.toLowerCase()
            );

            if (isAllowed) {
                video.style.display = ''; // Show
            } else {
                video.style.display = 'none'; // Hide
            }
        }
    });
    
    // Inject or update the message
    injectMotivationalMessage();
}

// 3. Helper to extract channel name from a video element (MORE ROBUST)
function extractChannelName(videoElement) {
    // Attempt 1: Look for the main channel link element using the common selectors
    let channelLink = videoElement.querySelector('a[href*="/channel/"]'); 
    
    if (channelLink) {
        // Use the displayed text of the link
        let nameText = channelLink.textContent.trim();
        if (nameText) return nameText;
    }

    // Fallback 1: Standard channel name block
    let nameNode = videoElement.querySelector('#channel-name #text');
    if (nameNode) return nameNode.textContent.trim();
    
    // Fallback 2: Compact/Sidebar views
    nameNode = videoElement.querySelector('.ytd-channel-name #text');
    if (nameNode) return nameNode.textContent.trim();

    // Fallback 3: Search results specific
    let complexText = videoElement.querySelector('#text.complex-string');
    if (complexText) return complexText.textContent.trim();

    return null;
}

// 4. Inject Motivational Message if page looks empty
function injectMotivationalMessage() {
    const selector = 'ytd-rich-grid-renderer, #contents.style-scope.ytd-section-list-renderer';
    const primaryContainer = document.querySelector(selector);
    
    // Only inject if the container exists and we are likely on the main feed
    if (primaryContainer) {
        let msgDiv = document.getElementById('focus-tube-msg');
        
        // If message is not present, create it
        if (!msgDiv) {
            msgDiv = document.createElement('div');
            msgDiv.id = 'focus-tube-msg';
            msgDiv.style.cssText = 'width: 100%; text-align: center; padding: 50px; font-size: 24px; color: #606060;';
            primaryContainer.prepend(msgDiv);
        }
        
        // Update the message content
        const videosVisible = document.querySelectorAll(VIDEO_SELECTORS.join(':not([style*="display: none"]),') + ':not([style*="display: none"])').length;
        
        if (videosVisible === 0 && allowedChannels.length > 0) {
            msgDiv.innerHTML = '<h2>🎯 Focus Mode Active</h2><p>No new videos from your whitelisted channels currently visible.</p>';
            msgDiv.style.display = '';
        } else if (allowedChannels.length === 0) {
             msgDiv.innerHTML = '<h2>🛑 Whitelist Empty</h2><p>Please add channels in the extension popup. All videos are currently hidden.</p>';
             msgDiv.style.display = '';
        } else {
            // Hide the message if videos are successfully filtered and shown
            msgDiv.style.display = 'none';
        }
    }
}

// Run the script
init();