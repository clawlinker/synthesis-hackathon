// Service Worker for background processing
let receiptCache = new Map();
const CACHE_TTL = 60000; // 1 minute

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openReceipts') {
    openReceipts(request.address);
    sendResponse({ status: 'opened' });
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'getCachedReceipts') {
    const cached = receiptCache.get(request.address);
    if (cached) {
      sendResponse({ receipts: cached, cached: true });
    } else {
      fetchReceipts(request.address).then(receipts => {
        receiptCache.set(request.address, receipts);
        sendResponse({ receipts, cached: false });
      });
      return true; // Keep channel open
    }
    return true;
  }
  
  if (request.action === 'clearCache') {
    receiptCache.clear();
    sendResponse({ status: 'cleared' });
  }
});

// Open receipts in popup window
function openReceipts(address) {
  chrome.action.openPopup().then(() => {
    // Popup will fetch receipts for the clicked address
  }).catch(() => {
    // Fallback: open in new tab
    chrome.tabs.create({
      url: `https://pawr.link/receipts?wallet=${address}`
    });
  });
}

// Fetch receipts from API
async function fetchReceipts(address) {
  try {
    const response = await fetch(`https://pawr.link/api/receipts?wallet=${address}&inference=true`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data.receipts || [];
  } catch (error) {
    console.error('Failed to fetch receipts:', error);
    return [];
  }
}

// Cache management
chrome.runtime.onStartup.addListener(() => {
  // Clear cache on browser restart
  receiptCache.clear();
});

// Clear cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [address, receipts] of receiptCache.entries()) {
    if (now - receipts.timestamp > CACHE_TTL) {
      receiptCache.delete(address);
    }
  }
}, CACHE_TTL);

// Export for testing
export { receiptCache, fetchReceipts };
