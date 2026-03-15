// State management
let currentWallet = '0x5793BFc1331538C5A8028e71Cc22B43750163af8'; // Clawlinker default

// DOM Elements
const receiptsList = document.getElementById('receiptsList');
const loadingEl = document.getElementById('loading');
const emptyStateEl = document.getElementById('emptyState');
const errorStateEl = document.getElementById('errorState');
const errorMessageEl = document.getElementById('errorMessage');
const refreshBtn = document.getElementById('refreshBtn');
const retryBtn = document.getElementById('retryBtn');
const walletButtons = document.querySelectorAll('.wallet-btn');

// API Configuration
const API_BASE = 'https://pawr.link/api';

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  initWalletSelection();
  fetchReceipts();
  
  refreshBtn.addEventListener('click', fetchReceipts);
  retryBtn.addEventListener('click', fetchReceipts);
});

// Initialize wallet selection buttons
function initWalletSelection() {
  walletButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      walletButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Set current wallet
      currentWallet = btn.dataset.wallet;
      
      // Fetch receipts for new wallet
      fetchReceipts();
    });
  });
}

// Fetch receipts from API
async function fetchReceipts() {
  // Reset UI
  loadingEl.style.display = 'flex';
  emptyStateEl.style.display = 'none';
  errorStateEl.style.display = 'none';
  receiptsList.innerHTML = '';
  isRefreshing = true;
  
  try {
    const url = `${API_BASE}/receipts?wallet=${currentWallet}&inference=true`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const receipts = data.receipts || [];
    
    // Render receipts
    if (receipts.length === 0) {
      showEmptyState();
    } else {
      renderReceipts(receipts);
    }
  } catch (error) {
    console.error('Failed to fetch receipts:', error);
    showError(`Failed to load receipts: ${error.message}`);
  } finally {
    isRefreshing = false;
    loadingEl.style.display = 'none';
  }
}

// Render receipts to DOM
function renderReceipts(receipts) {
  receiptsList.innerHTML = '';
  
  // Sort by timestamp (newest first)
  const sortedReceipts = [...receipts].sort((a, b) => b.timestamp - a.timestamp);
  
  sortedReceipts.forEach((receipt, index) => {
    const card = createReceiptCard(receipt, index);
    receiptsList.appendChild(card);
  });
}

// Create receipt card element
function createReceiptCard(receipt, index) {
  const card = document.createElement('div');
  card.className = `receipt-card ${receipt.service?.includes('Bankr LLM') ? 'inference' : ''}`;
  card.style.animationDelay = `${index * 0.05}s`;
  
  // Direction icon and text
  const directionClass = receipt.direction === 'sent' ? 'sent' : 'received';
  const directionIcon = receipt.direction === 'sent' ? '→' : '←';
  
  // Amount formatting
  const amount = parseFloat(receipt.amount || 0).toFixed(4);
  const amountClass = receipt.direction === 'sent' ? 'text-error' : 'text-success';
  
  // Service text
  const serviceText = receipt.service || 'Direct transfer';
  const isAgentService = receipt.agentId && receipt.agentId !== '0';
  
  // Chain badge
  const chainId = receipt.blockNumber === '0' ? '1' : '8453'; // Inference = Ethereum, USDC = Base
  const chainName = chainId === '1' ? 'Ethereum' : 'Base';
  
  // Timestamp formatting
  const timestamp = new Date(receipt.timestamp * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  card.innerHTML = `
    <div class="receipt-header">
      <span class="receipt-txhash" title="${receipt.hash}">${receipt.hash.substring(0, 16)}...</span>
      <span class="receipt-timestamp">${timestamp}</span>
    </div>
    <div class="receipt-body">
      <div class="receipt-direction ${directionClass}">
        ${directionIcon} ${amount} ${receipt.tokenSymbol || 'USDC'}
      </div>
    </div>
    <div class="receipt-service">
      <span class="receipt-service-text">${serviceText}</span>
    </div>
    <div class="receipt-footer">
      <a href="https://base.blockscout.com/tx/${receipt.hash}" target="_blank" rel="noopener noreferrer" class="receipt-link">
        View on Blockscout
      </a>
      <span class="receipt-chain">
        ${chainName === 'Ethereum' ? 'ETH' : 'ETH'} • ${chainName}
      </span>
    </div>
  `;
  
  return card;
}

// Show empty state
function showEmptyState() {
  loadingEl.style.display = 'none';
  emptyStateEl.style.display = 'flex';
}

// Show error state
function showError(message) {
  loadingEl.style.display = 'none';
  errorMessageEl.textContent = message;
  errorStateEl.style.display = 'flex';
}

// Note: This file runs in browser extension popup context (not Node.js module)
// The functions are attached to window scope via event listeners for user interaction
