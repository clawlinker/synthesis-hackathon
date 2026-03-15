# Agent Receipts Chrome Extension

View verifiable agent transaction receipts directly on Etherscan, Blockscout, and DexScreener.

## Features

- **Inline Receipt Badges**: See agent receipt counts directly on wallet addresses
- **Receipt Preview**: Click to view full receipt details in a popup
- **Multi-Agent Support**: Switch between Clawlinker and Bankr wallets
- **Inference Receipts**: View Bankr LLM costs alongside USDC transactions
- **Live Data**: Real-time receipt data from the Agent Receipts API

## Installation

### For Development

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `extension` directory

### From Chrome Web Store

*Coming soon*

## Usage

### On Etherscan/Blockscout/DexScreener

1. Navigate to any page with wallet addresses
2. Look for "Receipts" badges next to agent addresses
3. Click to view the receipt count
4. Click the badge to see full receipt details

### Receipt Types

- **USDC Receipts**: Real on-chain USDC transfers from x402 payments
- **Inference Receipts**: Bankr LLM API usage costs (showing compute budget transparency)

## API Endpoints

The extension uses the following API endpoints:

- `GET /api/receipts?wallet={address}&inference={boolean}` - Fetch receipts for a wallet

## Development

### Project Structure

```
extension/
├── manifest.json          # Extension manifest (v3)
├── popup.html             # Popup window UI
├── popup.css              # Popup styles
├── popup.js               # Popup logic
├── content.js             # Content script for injection
├── background.js          # Service worker
├── storage_schema.json    # Storage schema
├── icon16.svg            # Extension icon (16px)
├── icon48.svg            # Extension icon (48px)
└── icon128.svg           # Extension icon (128px)
```

### Running Locally

1. Ensure you're running the Next.js app locally or on a public URL
2. Load the extension in Chrome as described above
3. Open DevTools in the extension to debug

### Building

```bash
# Build the Next.js app first
cd /root/synthesis-hackathon
npm run build

# Extension is ready to use from the extension/ directory
```

## Configuration

The extension supports the following storage options:

- `defaultWallet`: Default wallet address
- `showInferenceReceipts`: Toggle inference receipts
- `apiEndpoint`: Custom API endpoint
- `autoRefresh`: Auto-refresh on tab activation
- `refreshInterval`: Refresh interval in seconds

## Privacy & Security

- No personal data is collected
- All API calls are made to the Agent Receipts API
- Receipt data is cached locally for 1 minute
- No data is shared with third parties

## Technical Details

### Manifest Version

This extension uses Manifest V3, the latest extension API from Chrome.

### Permissions

- `activeTab`: Interact with the current tab
- `scripting`: Inject scripts dynamically
- `storage`: Store user preferences
- `host_permissions`: Access to Etherscan, Blockscout, DexScreener, and the API

### Content Script Injection

The extension injects a badge element next to detected agent addresses on:
- Etherscan address pages
- Blockscout address pages
- DexScreener token pages

### Cache Strategy

- Receipt count: 1-minute TTL
- Full receipts: Cached per session

## Troubleshooting

### Receipts not showing

1. Check that the extension is enabled in `chrome://extensions`
2. Verify the API endpoint is accessible
3. Try refreshing the page

### Wrong address detected

The extension detects addresses using regex patterns. If an address is incorrectly detected:

1. Report the issue with the URL
2. The detection logic can be updated

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- GitHub Issues: [clawlinker/agent-receipts](https://github.com/clawlinker/agent-receipts)
- Twitter: [@clawlinker](https://x.com/clawlinker)
- Farcaster: @clawlinker

---

**Agent Receipts** - Verifiable audit trail for autonomous agent transactions
