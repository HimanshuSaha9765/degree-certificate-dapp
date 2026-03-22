// ================================================================
//  contract.js — All Blockchain Interaction Functions
//  Depends on: ethers.js, config.js, wallet.js
// ================================================================

const ContractManager = {
  // ──────────────────────────────────────────
  //  GET CONTRACT INSTANCE
  // ──────────────────────────────────────────

  // Read-only (no gas, free)
  getReadContract() {
      // If MetaMask available — use it
      if (WalletManager.isMetaMaskInstalled()) {
        const provider = WalletManager.getProvider();
        if (provider) {
          return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        }
      }

      // ── FALLBACK: Public RPC for mobile/no-wallet browsers ──
      // Uses Sepolia public RPC — no API key needed
      const fallbackProvider = new ethers.providers.JsonRpcProvider(
        "https://rpc.sepolia.org"
      );
      return new ethers.Contract(
        CONTRACT_ADDRESS, CONTRACT_ABI, fallbackProvider
      );
    },

  // Write (costs gas, needs signer)
  getWriteContract() {
    const signer = WalletManager.getSigner();
    if (!signer) return null;
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  },

  // ──────────────────────────────────────────
  //  ISSUER PROFILE
  // ──────────────────────────────────────────

  async setIssuerProfile(institutionName, logoHash) {
    try {
      const contract = this.getWriteContract();
      const tx = await contract.setIssuerProfile(
        institutionName,
        logoHash || "",
      );
      this._showPending("Saving profile to blockchain...");
      await tx.wait();
      this._showSuccess("Profile saved successfully!");
      return { success: true };
    } catch (error) {
      return this._handleError(error);
    }
  },

  async getIssuerProfile(address) {
    try {
      const contract = this.getReadContract();
      const result = await contract.getIssuerProfile(address);
      return {
        success: true,
        institutionName: result.institutionName,
        logoHash: result.logoHash,
        isRegistered: result.isRegistered,
        totalIssued: result.totalIssued.toNumber(),
        totalRevoked: result.totalRevoked.toNumber(),
      };
    } catch (error) {
      return this._handleError(error);
    }
  },

  // ──────────────────────────────────────────
  //  ISSUE CERTIFICATE
  // ──────────────────────────────────────────

  async issueCertificate(
    certId,
    studentName,
    degree,
    institution,
    year,
    expiryDate,
  ) {
    try {
      // Convert expiry date to unix timestamp (0 if not provided)
      let expiryTimestamp = 0;
      if (expiryDate && expiryDate !== "") {
        expiryTimestamp = Math.floor(new Date(expiryDate).getTime() / 1000);
      }

      const contract = this.getWriteContract();
      const tx = await contract.issueCertificate(
        certId,
        studentName,
        degree,
        institution,
        parseInt(year),
        expiryTimestamp,
      );

      this._showPending("Issuing certificate on blockchain...");
      const receipt = await tx.wait();
      this._showSuccess("Certificate issued successfully!");

      // Log to audit
      AuditLog.add("issuer", "issued", {
        certId,
        studentName,
        degree,
        txHash: receipt.transactionHash,
      });

      return { success: true, txHash: receipt.transactionHash };
    } catch (error) {
      return this._handleError(error);
    }
  },

  // ──────────────────────────────────────────
  //  REVOKE CERTIFICATE
  // ──────────────────────────────────────────

  async revokeCertificate(certId) {
    try {
      const contract = this.getWriteContract();
      const tx = await contract.revokeCertificate(certId);
      this._showPending("Revoking certificate...");
      const receipt = await tx.wait();
      this._showSuccess("Certificate revoked.");

      AuditLog.add("issuer", "revoked", {
        certId,
        txHash: receipt.transactionHash,
      });

      return { success: true };
    } catch (error) {
      return this._handleError(error);
    }
  },

  // ──────────────────────────────────────────
  //  VERIFY CERTIFICATE (write — emits event)
  // ──────────────────────────────────────────

  async verifyCertificate(certId) {
    try {
      // First do a free read to check existence
      const readResult = await this.getCertificate(certId);

      if (!readResult.success || !readResult.exists) {
        return { success: true, isValid: false, notFound: true };
      }

      // Log to audit
      AuditLog.add("verifier", "verified", { certId });

      return readResult;
    } catch (error) {
      return this._handleError(error);
    }
  },

  // ──────────────────────────────────────────
  //  GET CERTIFICATE (read-only, free)
  // ──────────────────────────────────────────

  async getCertificate(certId) {
      try {
        const contract = this.getReadContract();
        if (!contract) {
          return { success: false, error: "Could not connect to blockchain" };
        }

        const result = await contract.getCertificate(certId);

        if (!result.exists) {
          return { success: true, exists: false };
        }

        // Safe number conversion (works on mobile too)
        const issueDateNum  = result.issueDate
          ? (result.issueDate.toNumber
              ? result.issueDate.toNumber()
              : Number(result.issueDate))
          : 0;

        const expiryDateNum = result.expiryDate
          ? (result.expiryDate.toNumber
              ? result.expiryDate.toNumber()
              : Number(result.expiryDate))
          : 0;

        const now       = Math.floor(Date.now() / 1000);
        const isExpired = expiryDateNum > 0 && now > expiryDateNum;
        const isValid   = result.exists && !result.isRevoked && !isExpired;

        return {
          success     : true,
          exists      : true,
          isValid,
          isRevoked   : result.isRevoked,
          isExpired,
          studentName : result.studentName,
          degree      : result.degree,
          institution : result.institution,
          year        : result.year,
          issueDate   : issueDateNum > 0
            ? new Date(issueDateNum * 1000).toLocaleDateString("en-IN", {
                day: "numeric", month: "long", year: "numeric"
              })
            : "—",
          issueDateRaw : issueDateNum,
          expiryDate   : expiryDateNum > 0
            ? new Date(expiryDateNum * 1000).toLocaleDateString("en-IN", {
                day: "numeric", month: "long", year: "numeric"
              })
            : "No Expiry",
          expiryDateRaw: expiryDateNum,
          issuer       : result.issuer
        };
      } catch (error) {
        return this._handleError(error);
      }
    },

  // ──────────────────────────────────────────
  //  GET CERTS BY ISSUER
  // ──────────────────────────────────────────

  async getCertsByIssuer(address) {
      try {
        const contract = this.getReadContract();
        if (!contract) return { success: false, ids: [] };
        const ids = await contract.getCertsByIssuer(address);
        return { success: true, ids };
      } catch (error) {
        return { success: false, ids: [] };
      }
    },

  // ──────────────────────────────────────────
  //  GET CERTS BY STUDENT NAME (for AI)
  // ──────────────────────────────────────────

  async getCertsByStudentName(name) {
      try {
        const contract = this.getReadContract();
        if (!contract) return { success: false, ids: [] };
        const ids = await contract.getCertsByStudentName(name);
        return { success: true, ids };
      } catch (error) {
        return { success: false, ids: [] };
      }
    },

  // ──────────────────────────────────────────
  //  GET TOTAL CERTIFICATES
  // ──────────────────────────────────────────

  async getTotalCertificates() {
      try {
        const contract = this.getReadContract();
        if (!contract) return { success: false, total: 0 };
        const total = await contract.getTotalCertificates();
        return { success: true, total: total.toNumber() };
      } catch (error) {
        return { success: false, total: 0 };
      }
    },

  // ──────────────────────────────────────────
  //  CHECK IF CERT ID EXISTS
  // ──────────────────────────────────────────

  async certIdExists(certId) {
      try {
        const contract = this.getReadContract();
        if (!contract) return { success: false, exists: false };
        const exists = await contract.certIdExists(certId);
        return { success: true, exists };
      } catch (error) {
        return { success: false, exists: false };
      }
    },

  // ──────────────────────────────────────────
  //  HELPER: SHOW PENDING / SUCCESS TOAST
  // ──────────────────────────────────────────

  _showPending(msg) {
    this._showToast(msg, "pending");
  },

  _showSuccess(msg) {
    this._showToast(msg, "success");
  },

  _showToast(msg, type) {
    // Remove existing toast
    const old = document.getElementById("tx-toast");
    if (old) old.remove();

    const toast = document.createElement("div");
    toast.id = "tx-toast";
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px;
      background: ${type === "success" ? "#10b981" : "#3b82f6"};
      color: white; padding: 14px 20px; border-radius: 10px;
      font-size: 14px; font-weight: 500; z-index: 9999;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = type === "pending" ? "⏳ " + msg : "✅ " + msg;
    document.body.appendChild(toast);

    if (type === "success") {
      setTimeout(() => toast.remove(), 4000);
    }
  },

  // ──────────────────────────────────────────
  //  HELPER: HANDLE ERRORS
  // ──────────────────────────────────────────

  _handleError(error) {
    console.error("Contract error:", error);

    let message = "Transaction failed.";

    if (error.code === 4001) {
      message = "Transaction rejected by user.";
    } else if (error.message?.includes("Certificate ID already exists")) {
      message = "This Certificate ID already exists on the blockchain.";
    } else if (error.message?.includes("Only the original issuer")) {
      message = "Only the original issuer can perform this action.";
    } else if (error.message?.includes("Already revoked")) {
      message = "This certificate is already revoked.";
    } else if (error.message?.includes("insufficient funds")) {
      message = "Insufficient Sepolia ETH. Get more from sepoliafaucet.com";
    } else if (error.reason) {
      message = error.reason;
    }

    // Show error toast
    const old = document.getElementById("tx-toast");
    if (old) old.remove();
    const toast = document.createElement("div");
    toast.id = "tx-toast";
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px;
      background: #ef4444; color: white;
      padding: 14px 20px; border-radius: 10px;
      font-size: 14px; font-weight: 500; z-index: 9999;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    `;
    toast.textContent = "❌ " + message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);

    return { success: false, error: message };
  },
};
