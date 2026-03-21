// ================================================================
//  certificate-gen.js — Certificate Generation Utilities
//  Handles: QR code generation, signature management,
//           PDF export helpers, certificate data formatting
// ================================================================

const CertGen = {
  // ──────────────────────────────────────────
  //  GENERATE QR CODE INTO A CONTAINER
  // ──────────────────────────────────────────

  /**
   * Generate a QR code into a DOM element
   * @param {string} containerId - ID of the container element
   * @param {string} certId      - Certificate ID to encode
   * @param {object} options     - Optional config overrides
   */
  generateQR(containerId, certId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear previous QR
    container.innerHTML = "";

    // Build verification URL
    const baseUrl =
      window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "");
    const verifyUrl = `${baseUrl}/public-verify.html?id=${encodeURIComponent(certId)}`;

    const config = {
      text: verifyUrl,
      width: options.width || 80,
      height: options.height || 80,
      colorDark: options.colorDark || "#1a3a5c",
      colorLight: options.colorLight || "#fffdf5",
      correctLevel: QRCode.CorrectLevel.M,
      ...options,
    };

    try {
      new QRCode(container, config);
      console.log("✅ QR generated for:", verifyUrl);
    } catch (e) {
      // Fallback: show cert ID as text
      container.innerHTML = `<div style="font-size:8px;color:#8a6a20;
                      text-align:center;padding:4px;
                      word-break:break-all">
           ${certId}
         </div>`;
      console.warn("QR generation failed:", e);
    }

    return verifyUrl;
  },

  // ──────────────────────────────────────────
  //  SAVE SIGNATURE TO LOCALSTORAGE
  // ──────────────────────────────────────────

  saveSignature(value, type, font = "") {
    localStorage.setItem(
      "certSignature",
      JSON.stringify({ value, type, font }),
    );
  },

  // ──────────────────────────────────────────
  //  LOAD SIGNATURE FROM LOCALSTORAGE
  // ──────────────────────────────────────────

  loadSignature() {
    try {
      return JSON.parse(localStorage.getItem("certSignature"));
    } catch (e) {
      return null;
    }
  },

  // ──────────────────────────────────────────
  //  CLEAR SIGNATURE
  // ──────────────────────────────────────────

  clearSignature() {
    localStorage.removeItem("certSignature");
  },

  // ──────────────────────────────────────────
  //  APPLY SIGNATURE TO DISPLAY ELEMENT
  // ──────────────────────────────────────────

  applySignature(displayElementId, sig) {
    const el = document.getElementById(displayElementId);
    if (!el || !sig) return;

    if (sig.type === "image") {
      el.innerHTML = `<img src="${sig.value}"
              style="max-height:55px;max-width:180px;
                     object-fit:contain"
              alt="Signature"/>`;
    } else if (sig.type === "text") {
      el.innerHTML = `<span style="font-family:'${sig.font}',cursive;
                       font-size:28px;color:#1a3a5c">
           ${sig.value}
         </span>`;
    }
  },

  // ──────────────────────────────────────────
  //  FORMAT CERTIFICATE DATA FOR DISPLAY
  // ──────────────────────────────────────────

  formatCertData(raw) {
    if (!raw) return null;
    return {
      certId: raw.certId || "—",
      studentName: raw.studentName || "—",
      degree: raw.degree || "—",
      institution: raw.institution || "—",
      year: raw.year || "—",
      issueDate: raw.issueDate || new Date().toLocaleDateString(),
      expiryDate: raw.expiryDate || "No Expiry",
      notes: raw.notes || "",
    };
  },

  // ──────────────────────────────────────────
  //  SAVE CERT DATA FOR PREVIEW PAGE
  // ──────────────────────────────────────────

  saveCertForPreview(certData) {
    localStorage.setItem("lastIssuedCert", JSON.stringify(certData));
  },

  // ──────────────────────────────────────────
  //  LOAD CERT DATA FROM STORAGE
  // ──────────────────────────────────────────

  loadCertFromStorage() {
    try {
      return JSON.parse(localStorage.getItem("lastIssuedCert"));
    } catch (e) {
      return null;
    }
  },

  // ──────────────────────────────────────────
  //  EXPORT PDF USING html2canvas + jsPDF
  // ──────────────────────────────────────────

  /**
   * Capture a DOM element and export as PDF
   * @param {string} elementId  - ID of element to capture
   * @param {string} filename   - Output filename (without .pdf)
   * @param {object} options    - jsPDF options
   */
  async exportPDF(elementId, filename = "certificate", options = {}) {
    const el = document.getElementById(elementId);
    if (!el) {
      console.error("Element not found:", elementId);
      return false;
    }

    try {
      // Capture element as canvas
      const canvas = await html2canvas(el, {
        scale: options.scale || 2,
        useCORS: true,
        backgroundColor: options.backgroundColor || "#fffdf5",
        logging: false,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      // Create PDF
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: options.orientation || "landscape",
        unit: "mm",
        format: options.format || "a4",
      });

      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      // Add certificate image
      pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);

      // Add metadata
      pdf.setProperties({
        title: "CertChain Certificate",
        subject: "Blockchain Verified Degree Certificate",
        author: "CertChain",
        keywords: "blockchain, certificate, verified",
        creator: "CertChain Verification System",
      });

      // Save file
      pdf.save(`${filename}.pdf`);
      return true;
    } catch (err) {
      console.error("PDF export failed:", err);
      return false;
    }
  },

  // ──────────────────────────────────────────
  //  GENERATE CERTIFICATE FILENAME
  // ──────────────────────────────────────────

  buildFilename(certData) {
    const name = (certData.studentName || "student")
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-]/g, "");
    const id = (certData.certId || "cert").replace(/[^a-zA-Z0-9-]/g, "");
    return `CertChain-${name}-${id}`;
  },

  // ──────────────────────────────────────────
  //  POPULATE CERTIFICATE HTML ELEMENT
  //  Maps cert data fields to DOM element IDs
  // ──────────────────────────────────────────

  populateCertHTML(certData) {
    const data = this.formatCertData(certData);
    if (!data) return;

    const fieldMap = {
      "cert-student-name": data.studentName,
      "cert-degree": data.degree,
      "cert-year": data.year,
      "cert-id": data.certId,
      "cert-issue-date": data.issueDate,
      "cert-institution-header": data.institution,
      "cert-institution-sig": data.institution,
      "info-name": data.studentName,
      "info-degree": data.degree,
      "info-id": data.certId,
      "info-institution": data.institution,
      "info-year": data.year,
    };

    Object.entries(fieldMap).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });

    // Apply saved institution logo if available
    const savedLogo = localStorage.getItem("institutionLogo");
    if (savedLogo) {
      const logoEl = document.getElementById("certLogo");
      if (logoEl) {
        logoEl.innerHTML = `<img src="${savedLogo}"
                style="width:100%;height:100%;
                       object-fit:contain"
                alt="Institution Logo"/>`;
      }
    }
  },

  // ──────────────────────────────────────────
  //  VALIDATE CERT DATA BEFORE GENERATING
  // ──────────────────────────────────────────

  validateCertData(certData) {
    const errors = [];

    if (!certData) return ["No certificate data provided"];

    if (!certData.studentName || certData.studentName.trim() === "")
      errors.push("Student name is missing");

    if (!certData.degree || certData.degree.trim() === "")
      errors.push("Degree is missing");

    if (!certData.institution || certData.institution.trim() === "")
      errors.push("Institution name is missing");

    if (!certData.year) errors.push("Graduation year is missing");

    if (!certData.certId || certData.certId.trim() === "")
      errors.push("Certificate ID is missing");

    return errors; // Empty array = valid
  },

  // ──────────────────────────────────────────
  //  COPY TEXT TO CLIPBOARD
  // ──────────────────────────────────────────

  async copyToClipboard(text, btnEl) {
    try {
      await navigator.clipboard.writeText(text);
      if (btnEl) {
        const orig = btnEl.textContent;
        btnEl.textContent = "✅ Copied!";
        setTimeout(() => (btnEl.textContent = orig), 2000);
      }
      return true;
    } catch (e) {
      console.error("Copy failed:", e);
      return false;
    }
  },

  // ──────────────────────────────────────────
  //  FORMAT DATE FOR DISPLAY ON CERTIFICATE
  // ──────────────────────────────────────────

  formatDate(dateInput) {
    if (!dateInput)
      return new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return dateInput;
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (e) {
      return dateInput;
    }
  },

  // ──────────────────────────────────────────
  //  GET INSTITUTION INFO FROM STORAGE
  // ──────────────────────────────────────────

  getInstitutionInfo() {
    return {
      name: localStorage.getItem("institutionName") || "Institution",
      logo: localStorage.getItem("institutionLogo") || null,
    };
  },

  // ──────────────────────────────────────────
  //  DOWNLOAD HISTORY MANAGEMENT
  // ──────────────────────────────────────────

  addToDownloadHistory(certData) {
    let history = [];
    try {
      history = JSON.parse(localStorage.getItem("download_history")) || [];
    } catch (e) {
      history = [];
    }

    history.unshift({
      certId: certData.certId,
      studentName: certData.studentName,
      degree: certData.degree,
      downloadedAt: new Date().toISOString(),
    });

    // Keep last 20 downloads
    localStorage.setItem(
      "download_history",
      JSON.stringify(history.slice(0, 20)),
    );
  },

  getDownloadHistory() {
    try {
      return JSON.parse(localStorage.getItem("download_history")) || [];
    } catch (e) {
      return [];
    }
  },

  clearDownloadHistory() {
    localStorage.removeItem("download_history");
  },

  // ──────────────────────────────────────────
  //  RENDER DOWNLOAD HISTORY TO ELEMENT
  // ──────────────────────────────────────────

  renderDownloadHistory(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const history = this.getDownloadHistory();

    if (history.length === 0) {
      el.innerHTML = `<p style="color:var(--text-muted);
                    text-align:center;
                    padding:16px;font-size:13px">
           No downloads yet
         </p>`;
      return;
    }

    el.innerHTML = history
      .map(
        (item) => `
      <div style="display:flex;justify-content:space-between;
                   align-items:center;padding:10px 16px;
                   border-bottom:1px solid var(--border);
                   font-size:13px">
        <div>
          <div style="font-weight:600;
                       color:var(--text-primary)">
            ${item.studentName}
          </div>
          <div style="font-size:11px;color:var(--text-muted);
                       font-family:var(--font-mono)">
            ${item.certId}
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:var(--text-muted)">
            ${new Date(item.downloadedAt).toLocaleDateString()}
          </div>
          <div style="font-size:10px;color:var(--text-muted)">
            ${new Date(item.downloadedAt).toLocaleTimeString()}
          </div>
        </div>
      </div>
    `,
      )
      .join("");
  },
};
