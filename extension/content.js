// Content script - Injects receipt badges on external sites
(function() {
  'use strict';

  // Configuration
  const API_BASE = 'https://pawr.link/api';
  const AGENT_ADDRESSES = {
    '0x5793BFc1331538C5A8028e71Cc22B43750163af8': 'clawlinker',
    '0x4de988e65a32a12487898c10bc63a88abea2e292': 'bankr'
  };

  // CSS for injected elements
  const injectStyles = `
    .agent-receipt-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: linear-gradient(135deg, #1a1a1a 0%, #232323 100%);
      border: 1px solid #333333;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      margin-left: 8px;
      user-select: none;
    }

    .agent-receipt-badge:hover {
      border-color: #2795e9;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(39, 149, 233, 0.2);
    }

    .agent-receipt-badge .icon {
      width: 14px;
      height: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .agent-receipt-badge .icon svg {
      width: 12px;
      height: 12px;
      fill: #2795e9;
    }

    .agent-receipt-badge .text {
      color: #ffffff;
    }

    .agent-receipt-badge .count {
      background: #2795e9;
      color: white;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 700;
      margin-left: 4px;
    }

    .agent-receipt-badge.inference .icon svg {
      fill: #f59e0b;
    }

    .agent-receipt-badge.inference {
      background: linear-gradient(135deg, #1a1a1a 0%, #2a2a1a 100%);
      border-color: #f59e0b;
    }

    .agent-receipt-badge.inference:hover {
      border-color: #d97706;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
    }

    .agent-receipt-badge.inference .count {
      background: #f59e0b;
      color: #1a1a1a;
    }

    .agent-receipt-badge.loading {
      opacity: 0.6;
      cursor: wait;
    }

    .agent-receipt-badge.error {
      background: linear-gradient(135deg, #1a1a1a 0%, #2a1a1a 100%);
      border-color: #ef4444;
    }

    .agent-receipt-badge.error .icon svg {
      fill: #ef4444;
    }

    .agent-receipt-badge.error .count {
      background: #ef4444;
    }
  `;

  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = injectStyles;
  document.head.appendChild(styleEl);

  // Detect Etherscan/Blockscout page type
  function detectPageType() {
    const url = window.location.href;
    if (url.includes('blockscout.com')) {
      return 'blockscout';
    } else if (url.includes('etherscan.io')) {
      return 'etherscan';
    } else if (url.includes('dexscreener.com')) {
      return 'dexscreener';
    }
    return null;
  }

  // Extract address from URL
  function extractAddress() {
    const url = window.location.href;
    const addressPattern = /0x[a-fA-F0-9]{40}/;
    const match = url.match(addressPattern);
    return match ? match[0] : null;
  }

  // Create badge element
  function createBadge(address, isInference = false) {
    const badge = document.createElement('div');
    badge.className = `agent-receipt-badge ${isInference ? 'inference' : ''}`;
    badge.title = 'View agent receipts';
    badge.dataset.address = address;
    badge.dataset.isInference = isInference;
    badge.innerHTML = `
      <div class="icon">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      </div>
      <span class="text">Receipts</span>
      <span class="count loading" id="receiptCount">...</span>
    `;

    return badge;
  }

  // Fetch receipt count for address
  async function fetchReceiptCount(address) {
    try {
      const response = await fetch(`${API_BASE}/receipts?wallet=${address}&inference=true`);
      if (!response.ok) {
        throw new Error('API error');
      }
      const data = await response.json();
      return data.receipts?.length || 0;
    } catch (error) {
      return -1; // Error state
    }
  }

  // Find address elements on the page
  function findAddressElements() {
    const elements = [];
    const pageType = detectPageType();

    if (pageType === 'etherscan') {
      // Etherscan: look for address links in various places
      document.querySelectorAll('a[href*="/address/"]').forEach(el => {
        const href = el.getAttribute('href');
        const addressMatch = href.match(/\/address\/(0x[a-fA-F0-9]{40})/);
        if (addressMatch) {
          elements.push({
            element: el,
            address: addressMatch[1],
            parent: el.parentElement
          });
        }
      });
    } else if (pageType === 'blockscout') {
      // Blockscout: look for address links
      document.querySelectorAll('a[href*="/address/"]').forEach(el => {
        const href = el.getAttribute('href');
        const addressMatch = href.match(/\/address\/(0x[a-fA-F0-9]{40})/);
        if (addressMatch) {
          elements.push({
            element: el,
            address: addressMatch[1],
            parent: el.parentElement
          });
        }
      });
    } else if (pageType === 'dexscreener') {
      // DexScreener: look for token addresses and pair info
      document.querySelectorAll('[class*="address"], [class*="tokenAddress"]').forEach(el => {
        const text = el.textContent || '';
        const match = text.match(/0x[a-fA-F0-9]{40}/);
        if (match) {
          elements.push({
            element: el,
            address: match[0],
            parent: el.parentElement || el
          });
        }
      });
    }

    return elements;
  }

  // Process address elements
  async function processAddressElements() {
    const addressElements = findAddressElements();
    const processedAddresses = new Set();

    for (const { element, address, parent } of addressElements) {
      if (processedAddresses.has(address)) continue;
      processedAddresses.add(address);

      // Check if badge already exists
      if (parent.querySelector('.agent-receipt-badge')) continue;

      // Skip if already a receipt badge
      if (element.classList.contains('agent-receipt-badge')) continue;

      try {
        // Check if this is an agent address
        const isAgent = AGENT_ADDRESSES[address.toLowerCase()] !== undefined;
        const isInference = !isAgent && Math.random() > 0.5; // Sample for demonstration

        if (isAgent || isInference) {
          const badge = createBadge(address, isInference);
          parent.appendChild(badge);

          // Fetch and update count
          const countEl = badge.querySelector('#receiptCount');
          const count = await fetchReceiptCount(address);
          
          if (count === -1) {
            badge.classList.add('error');
            countEl.textContent = 'ERR';
          } else if (count > 0) {
            countEl.textContent = count;
          } else {
            countEl.textContent = '0';
          }

          // Add click handler
          badge.addEventListener('click', () => {
            chrome.runtime.sendMessage({
              action: 'openReceipts',
              address: address
            });
          });
        }
      } catch (error) {
        // Gracefully handle errors without breaking other badges
        console.warn(`Failed to process address ${address}:`, error);
      }
    }
  }

  // Initial processing
  processAddressElements();

  // Re-process periodically (for dynamic content)
  const interval = setInterval(processAddressElements, 3000);

  // Cleanup on page navigation (for SPA)
  const cleanup = () => {
    clearInterval(interval);
  };
  
  // Listen for navigation events in SPA
  const cleanupOnNav = () => {
    clearInterval(interval);
  };
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'refreshReceipts') {
      processAddressElements();
    }
  });

  // Handle SPA navigation (common patterns)
  const originalPushState = history.pushState;
  history.pushState = function() {
    originalPushState.apply(this, arguments);
    cleanupOnNav();
  };
  
  window.addEventListener('popstate', cleanupOnNav);
  window.addEventListener('beforeunload', cleanup);

})();
