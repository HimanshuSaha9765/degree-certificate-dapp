// ================================================================
//  wallet.js — MetaMask Connection & Wallet Management
// ================================================================

const WalletManager = {
  // Current connected wallet address
  currentAccount: null,

  // ──────────────────────────────────────────
  //  CHECK IF METAMASK IS INSTALLED
  // ──────────────────────────────────────────
  isMetaMaskInstalled() {
    return typeof window.ethereum !== "undefined" && window.ethereum.isMetaMask;
  },

  // ──────────────────────────────────────────
  //  CONNECT WALLET
  // ──────────────────────────────────────────
  async connectWallet() {
    if (!this.isMetaMaskInstalled()) {
      alert(
        "MetaMask not found!\nPlease install MetaMask from https://metamask.io",
      );
      return null;
    }

    try {
      // Request wallet connection
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length === 0) {
        alert("No accounts found. Please unlock MetaMask.");
        return null;
      }

      this.currentAccount = accounts[0];

      // Check if on Sepolia (chainId = 11155111)
      await this.checkNetwork();

      // Save to sessionStorage
      sessionStorage.setItem("connectedWallet", this.currentAccount);

      console.log("✅ Wallet connected:", this.currentAccount);
      return this.currentAccount;
    } catch (error) {
      if (error.code === 4001) {
        alert("Connection rejected. Please accept the MetaMask request.");
      } else {
        alert("Error connecting wallet: " + error.message);
      }
      return null;
    }
  },

  // ──────────────────────────────────────────
  //  DISCONNECT WALLET
  // ──────────────────────────────────────────
  disconnectWallet() {
    this.currentAccount = null;
    sessionStorage.removeItem("connectedWallet");
    sessionStorage.removeItem("userRole");
    console.log("🔌 Wallet disconnected");
    window.location.href = "index.html";
  },

  // ──────────────────────────────────────────
  //  CHECK NETWORK (Must be Sepolia)
  // ──────────────────────────────────────────
  async checkNetwork() {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });

    // Sepolia chainId = 0xaa36a7 (11155111 in decimal)
    if (chainId !== "0xaa36a7") {
      alert(
        "Wrong Network Detected!\n\n" +
          "Please switch to Sepolia Test Network in MetaMask.\n\n" +
          "Steps:\n" +
          "1. Open MetaMask\n" +
          "2. Click network dropdown\n" +
          "3. Select 'Sepolia test network'",
      );

      // Auto-request network switch
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xaa36a7" }],
        });
      } catch (switchError) {
        console.error("Could not switch network:", switchError);
      }
    }
  },

  // ──────────────────────────────────────────
  //  GET CURRENT ACCOUNT
  // ──────────────────────────────────────────
  async getCurrentAccount() {
    if (!this.isMetaMaskInstalled()) return null;

    try {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      this.currentAccount = accounts.length > 0 ? accounts[0] : null;
      return this.currentAccount;
    } catch (error) {
      console.error("Error getting account:", error);
      return null;
    }
  },

  // ──────────────────────────────────────────
  //  GET ETHERS PROVIDER & SIGNER
  // ──────────────────────────────────────────
  getProvider() {
    if (!this.isMetaMaskInstalled()) return null;
    return new ethers.providers.Web3Provider(window.ethereum);
  },

  getSigner() {
    const provider = this.getProvider();
    if (!provider) return null;
    return provider.getSigner();
  },

  // ──────────────────────────────────────────
  //  FORMAT ADDRESS (0x1234...5678)
  // ──────────────────────────────────────────
  formatAddress(address) {
    if (!address) return "Not connected";
    return address.slice(0, 6) + "..." + address.slice(-4);
  },

  // ──────────────────────────────────────────
  //  LISTEN FOR ACCOUNT / NETWORK CHANGES
  // ──────────────────────────────────────────
  listenForChanges() {
    if (!this.isMetaMaskInstalled()) return;

    // Account changed
    window.ethereum.on("accountsChanged", (accounts) => {
      if (accounts.length === 0) {
        alert("MetaMask locked. Please reconnect.");
        this.disconnectWallet();
      } else {
        this.currentAccount = accounts[0];
        sessionStorage.setItem("connectedWallet", this.currentAccount);
        window.location.reload();
      }
    });

    // Network changed
    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });
  },

  // ──────────────────────────────────────────
  //  SAVE & GET USER ROLE
  // ──────────────────────────────────────────
  saveRole(role) {
    // role = "issuer" | "verifier" | "public"
    sessionStorage.setItem("userRole", role);
  },

  getRole() {
    return sessionStorage.getItem("userRole");
  },

  // ──────────────────────────────────────────
  //  RESTORE SESSION (on page load)
  // ──────────────────────────────────────────
  restoreSession() {
    const saved = sessionStorage.getItem("connectedWallet");
    if (saved) {
      this.currentAccount = saved;
      return saved;
    }
    return null;
  },

  // ──────────────────────────────────────────
  //  REQUIRE WALLET (redirect if not connected)
  // ──────────────────────────────────────────
  requireWallet(redirectTo = "index.html") {
    const account = this.restoreSession();
    if (!account) {
      alert("Please connect your wallet first.");
      window.location.href = redirectTo;
      return null;
    }
    return account;
  },

  // ──────────────────────────────────────────
  //  REQUIRE ROLE (redirect if wrong role)
  // ──────────────────────────────────────────
  requireRole(allowedRoles = [], redirectTo = "role-select.html") {
    const role = this.getRole();
    if (!role || !allowedRoles.includes(role)) {
      alert("Access denied. Please select the correct role.");
      window.location.href = redirectTo;
      return null;
    }
    return role;
  },
};

// Auto-start listeners when page loads
window.addEventListener("load", () => {
  WalletManager.listenForChanges();
});
