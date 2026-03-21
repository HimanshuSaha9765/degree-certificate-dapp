# CertChain — Blockchain Degree Certificate Verification System

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://your-vercel-url.vercel.app)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-363636?style=for-the-badge&logo=solidity)](https://soliditylang.org)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-3C3C3D?style=for-the-badge&logo=ethereum)](https://sepolia.etherscan.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

> A decentralized application (DApp) for issuing, verifying, and
> authenticating academic degree certificates on the Ethereum blockchain
> with AI-powered fraud detection.

---

## 🌐 Live Demo

🔗 **[Try CertChain Live →](degree-certificate-dapp.vercel.app)**

| Role        | What You Can Do                                  |
| ----------- | ------------------------------------------------ |
| 🎓 Issuer   | Issue certificates, generate PDF, manage profile |
| 🔍 Verifier | Full AI fraud analysis, trust score report       |
| 👤 Public   | Simple certificate lookup — no wallet needed     |

---

## 📌 Table of Contents

- [What is CertChain?](#what-is-certchain)
- [Features](#features)
- [How It Works](#how-it-works)
- [AI Fraud Detection](#ai-fraud-detection)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Smart Contract](#smart-contract)
- [Screenshots](#screenshots)
- [FAQ](#faq)
- [License](#license)

---

## 🔗 What is CertChain?

**CertChain** is an open-source blockchain-based degree certificate
verification system. It allows universities and colleges to issue
tamper-proof digital certificates on the **Ethereum Sepolia testnet**,
and enables employers and the public to verify them instantly without
trusting any central authority.

Traditional paper certificates can be forged, altered, or backdated.
CertChain eliminates this by storing certificate data permanently
on-chain — where every record is **public, immutable, and
cryptographically secured**.

### 🎯 Problem Solved

- ❌ Paper certificates are easily forged
- ❌ Verification takes days through registrar offices
- ❌ No fraud pattern detection in existing systems
- ❌ Single point of failure (central database)

### ✅ CertChain Solution

- ✅ Blockchain makes forgery mathematically impossible
- ✅ Instant verification in under 3 seconds
- ✅ AI engine detects fraud patterns automatically
- ✅ Fully decentralized — no central server

---

## ✨ Features

### 🔐 Blockchain Features

- **On-chain certificate storage** — Ethereum Sepolia testnet
- **Tamper-proof records** — immutable smart contract storage
- **Wallet-based identity** — MetaMask authentication
- **Certificate revocation** — issuer can revoke at any time
- **Optional expiry dates** — certificates can have validity periods
- **Public transparency** — all records readable by anyone

### 👥 Role-Based Access

- **Issuer Dashboard** — issue, manage, and revoke certificates
- **Verifier Dashboard** — full AI analysis and trust reports
- **Public Verify** — simple lookup, no wallet required

### 📄 Certificate PDF Generator

- Beautiful A4 landscape PDF certificate
- Automatic QR code generation (links to verification page)
- **3 signature methods:**
  - ✏️ Draw with mouse or touch
  - 📁 Upload signature image (PNG/JPG)
  - Aa Type name in cursive font
- Institution logo support
- One-click PDF download

### 🤖 AI Fraud Detection Engine

- 8-point rule-based analysis
- Trust Score (0–100)
- Risk classification: Safe / Medium Risk / High Risk
- Detailed fraud report for verifiers
- Simplified result for public users (Safe / Warning / Risky)

### 📊 Additional Features

- Audit log for issuers and verifiers
- Search history with quick-access chips
- Activity statistics dashboard
- Export reports as JSON
- Dark mode across all pages
- Fully responsive mobile design

---

## ⚙️ How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    CERTCHAIN FLOW                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. ISSUER (College)                                        │
│     → Connects MetaMask wallet                              │
│     → Fills: Student Name, Degree, Year, Cert ID           │
│     → Clicks Issue → MetaMask confirms → Stored on-chain   │
│     → Generates PDF certificate with QR + signature        │
│                                                             │
│  2. STUDENT                                                 │
│     → Receives PDF certificate from institution            │
│     → Shares with employer when applying for jobs          │
│                                                             │
│  3. VERIFIER (Employer)                                     │
│     → Enters Certificate ID or scans QR code               │
│     → Blockchain returns certificate data instantly         │
│     → AI engine analyzes for fraud patterns                 │
│     → Gets Trust Score + detailed report                    │
│                                                             │
│  4. PUBLIC USER (Anyone)                                    │
│     → Enters Certificate ID — no wallet needed             │
│     → Gets simple ✅ Safe / ⚠️ Warning / 🚨 Risky result   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🤖 AI Fraud Detection

CertChain uses a **rule-based intelligence engine** that runs 8 checks
on every certificate and calculates a Trust Score from 0 to 100.

| Check                   | Description                     | Score Impact          |
| ----------------------- | ------------------------------- | --------------------- |
| 1. Existence            | Certificate found on blockchain | −100 if missing       |
| 2. Revocation           | Not revoked by issuer           | −80 if revoked        |
| 3. Expiry               | Within validity period          | −40 if expired        |
| 4. Data Completeness    | All fields present              | −10 per missing field |
| 5. Year Validation      | 1980–current year               | −15 if invalid        |
| 6. Multi-Degree Pattern | Same name, 4+ degrees           | −20 if suspicious     |
| 7. Bulk Issuing         | Issuer volume analysis          | −15 if >100 certs     |
| 8. Issuer Address       | Valid Ethereum address          | −10 if invalid        |

### Trust Score Classification

| Score  | Risk Level     | Meaning                                |
| ------ | -------------- | -------------------------------------- |
| 80–100 | ✅ Safe        | Certificate is trustworthy             |
| 50–79  | ⚠️ Medium Risk | Some patterns flagged — verify further |
| 0–49   | 🚨 High Risk   | Multiple issues — do not trust         |

---

## 🛠️ Tech Stack

| Technology             | Purpose                                   |
| ---------------------- | ----------------------------------------- |
| **Solidity 0.8.19**    | Smart contract language                   |
| **Ethereum Sepolia**   | Test blockchain network                   |
| **ethers.js v5.7.2**   | Blockchain interaction from browser       |
| **MetaMask**           | Wallet connection and transaction signing |
| **HTML5 + CSS3**       | Frontend pages                            |
| **Vanilla JavaScript** | Application logic                         |
| **jsPDF**              | PDF certificate generation                |
| **QRCode.js**          | QR code generation                        |
| **Remix IDE**          | Smart contract development & deployment   |

---

## 📁 Project Structure

```
degree-certificate-dapp/
│
├── contracts/
│   └── CertificateRegistry.sol    # Solidity smart contract
│
├── css/
│   └── style.css                  # Global styles + dark mode
│
├── js/
│   ├── config.js                  # Contract address + ABI
│   ├── wallet.js                  # MetaMask connection
│   ├── contract.js                # Blockchain interactions
│   ├── ai-engine.js               # AI fraud detection engine
│   ├── certificate-gen.js         # PDF + QR code utilities
│   └── audit-log.js               # Activity logging
│
├── index.html                     # Home page
├── role-select.html               # Role selection
├── issuer-profile.html            # Institution profile setup
├── issue-certificate.html         # Issue certificate form
├── issuer-dashboard.html          # Issuer dashboard + stats
├── certificate-preview.html       # PDF generator + signature
├── verifier-dashboard.html        # Verifier search + AI report
├── ai-analysis.html               # Full AI fraud report page
├── public-verify.html             # Public verification page
├── about.html                     # About page
└── README.md                      # This file
```

---

## 🚀 Getting Started

### Prerequisites

- [MetaMask](https://metamask.io) browser extension installed
- Sepolia test ETH
  ([get free ETH here](https://sepoliafaucet.com))
- [VS Code](https://code.visualstudio.com) with
  [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
  extension

### Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/degree-certificate-dapp.git

# 2. Open in VS Code
cd degree-certificate-dapp
code .

# 3. Right-click index.html → Open with Live Server

# 4. Open http://127.0.0.1:5500 in your browser
```

### Deploy Your Own Smart Contract

1. Open [Remix IDE](https://remix.ethereum.org)
2. Create `CertificateRegistry.sol` and paste the contract code
3. Compile with Solidity `0.8.19`
4. Deploy using **Injected Provider - MetaMask** on Sepolia
5. Copy the deployed contract address
6. Paste it in `js/config.js` → `CONTRACT_ADDRESS`

---

## 📜 Smart Contract

**Network:** Ethereum Sepolia Testnet
**Language:** Solidity ^0.8.19

### Key Functions

```solidity
// Issue a new certificate
function issueCertificate(
    string memory _certId,
    string memory _name,
    string memory _degree,
    string memory _institution,
    uint16 _year,
    uint256 _expiryDate
) external

// Verify a certificate (emits event)
function verifyCertificate(string memory _certId)
    external returns (bool, bool, bool, ...)

// Revoke a certificate (issuer only)
function revokeCertificate(string memory _certId) external

// Set institution profile
function setIssuerProfile(
    string memory _institutionName,
    string memory _logoHash
) external
```

### Events

```solidity
event CertificateIssued(string certId, string studentName, ...)
event CertificateRevoked(string certId, address revokedBy, ...)
event CertificateVerified(string certId, address verifiedBy, ...)
event IssuerProfileUpdated(address issuer, string institutionName)
```

---

## ❓ FAQ

**Q: Is this free to use?**
A: Yes. It runs on the Sepolia testnet which uses free test ETH.
No real money is involved.

**Q: Can any university use this?**
A: Yes. Any MetaMask wallet can act as an issuer.
The trust model is based on the issuer's wallet address.
In production, you would add an admin whitelist.

**Q: Is the certificate data public?**
A: Yes. All data stored on the blockchain is publicly readable.
Do not store sensitive personal data beyond what is necessary.

**Q: Does the logo upload persist across devices?**
A: No. The logo is stored in browser localStorage and is
device-specific. It only affects the PDF certificate appearance.

**Q: Can a revoked certificate be un-revoked?**
A: No. Revocation is permanent on the blockchain.

**Q: What happens after Sepolia testnet is deprecated?**
A: The contract can be redeployed on any EVM-compatible network
by updating the contract address in `js/config.js`.

---

## 🔒 Security Notes

- Never commit your private key or mnemonic phrase
- The `config.js` contract address is public — this is fine
- All transactions require MetaMask confirmation
- The contract uses `msg.sender` for issuer authentication

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 🙏 Acknowledgements

- [OpenZeppelin](https://openzeppelin.com) — Solidity best practices
- [ethers.js](https://docs.ethers.org) — Ethereum library
- [Remix IDE](https://remix.ethereum.org) — Smart contract IDE
- [MetaMask](https://metamask.io) — Web3 wallet
- [QRCode.js](https://github.com/davidshimjs/qrcodejs) — QR generation
- [jsPDF](https://github.com/parallax/jsPDF) — PDF generation

---

<div align="center">
  Built with ❤️ on Ethereum Blockchain
  <br/>
  <strong>CertChain</strong> — Making certificates trustworthy
</div>
```

---

# Step 3: Create .gitignore file

Create `.gitignore` in root folder:

```
# OS files
.DS_Store
Thumbs.db

# VS Code
.vscode/
*.code-workspace

# Node (if added later)
node_modules/
npm-debug.log

# Environment files (NEVER commit these)
.env
.env.local

# Build outputs
dist/
build/
```
