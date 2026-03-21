// ================================================================
//  ai-engine.js — Certificate Intelligence & Fraud Detection
//  Rule-based AI engine that analyzes certificates for fraud
//  No external API — fully client-side logic
// ================================================================

const AIEngine = {
  // ──────────────────────────────────────────
  //  MAIN ANALYSIS (for Verifier — full report)
  // ──────────────────────────────────────────

  /**
   * Full analysis for Verifier dashboard
   * @param {object} params - { certId, cert, issuerCerts, studentCerts }
   * @returns {object} Full analysis report
   */
  async analyze({ certId, cert, issuerCerts, studentCerts } = {}) {
    // Safety defaults
    issuerCerts = Array.isArray(issuerCerts) ? issuerCerts : [];
    studentCerts = Array.isArray(studentCerts) ? studentCerts : [];

    // Start with perfect score
    let score = 100;

    // Track all checks and flags
    const checks = [];
    const flags = [];
    const scoreBreakdown = [];

    // ── CHECK 1: Certificate Existence ──────────
    const existsCheck = {
      name: "Certificate Existence",
      detail: "Verifies the certificate ID exists on the blockchain",
      impact: "Certificate must exist to be valid",
      scoreImpact: 0,
    };

    if (!cert || !cert.exists) {
      existsCheck.passed = false;
      existsCheck.detail =
        "No certificate found with this ID on the blockchain";
      existsCheck.scoreImpact = -100;
      score = 0;

      checks.push(existsCheck);
      flags.push({
        type: "danger",
        icon: "❌",
        title: "Certificate Not Found",
        description: "This certificate ID does not exist on the blockchain.",
        detail:
          "This could mean the certificate is fake, the ID is wrong, or it was never issued.",
      });

      return this._buildResult(
        score,
        checks,
        flags,
        scoreBreakdown,
        cert,
        certId,
      );
    }

    existsCheck.passed = true;
    existsCheck.detail = `Certificate found on blockchain (issued ${cert.issueDate})`;
    existsCheck.scoreImpact = 0;
    checks.push(existsCheck);

    // ── CHECK 2: Revocation Status ──────────────
    const revokedCheck = {
      name: "Revocation Status",
      detail: "",
      impact: "Revoked certificates are permanently invalid",
      scoreImpact: 0,
    };

    if (cert.isRevoked) {
      revokedCheck.passed = false;
      revokedCheck.detail =
        "This certificate has been officially revoked by the issuing institution";
      revokedCheck.scoreImpact = -80;
      score -= 80;

      checks.push(revokedCheck);
      flags.push({
        type: "danger",
        icon: "🚫",
        title: "Certificate Revoked",
        description:
          "The issuing institution has permanently revoked this certificate.",
        detail:
          "Contact the institution directly to understand why it was revoked.",
      });
    } else {
      revokedCheck.passed = true;
      revokedCheck.detail = "Certificate has not been revoked by the issuer";
      revokedCheck.scoreImpact = 0;
      checks.push(revokedCheck);
    }

    // ── CHECK 3: Expiry Status ───────────────────
    const expiryCheck = {
      name: "Expiry / Validity Period",
      detail: "",
      impact: "Expired certificates may no longer be accepted",
      scoreImpact: 0,
    };

    if (cert.isExpired) {
      expiryCheck.passed = false;
      expiryCheck.detail = `Certificate expired on ${cert.expiryDate}`;
      expiryCheck.scoreImpact = -40;
      score -= 40;

      checks.push(expiryCheck);
      flags.push({
        type: "warning",
        icon: "⏰",
        title: "Certificate Expired",
        description: `This certificate expired on ${cert.expiryDate}.`,
        detail: "The issuer set an expiry date that has now passed.",
      });
    } else {
      expiryCheck.passed = true;
      expiryCheck.detail =
        cert.expiryDate === "No Expiry"
          ? "No expiry date set — certificate has permanent validity"
          : `Valid until ${cert.expiryDate}`;
      expiryCheck.scoreImpact = 0;
      checks.push(expiryCheck);
    }

    // ── CHECK 4: Data Completeness ───────────────
    const dataCheck = {
      name: "Data Completeness",
      detail: "",
      impact: "Incomplete data may indicate tampered records",
      scoreImpact: 0,
    };

    const missingFields = [];
    if (!cert.studentName || cert.studentName.trim() === "")
      missingFields.push("Student Name");
    if (!cert.degree || cert.degree.trim() === "") missingFields.push("Degree");
    if (!cert.institution || cert.institution.trim() === "")
      missingFields.push("Institution");
    if (!cert.year || cert.year === 0) missingFields.push("Graduation Year");

    if (missingFields.length > 0) {
      dataCheck.passed = false;
      dataCheck.detail = `Missing fields: ${missingFields.join(", ")}`;
      dataCheck.scoreImpact = -10 * missingFields.length;
      score -= 10 * missingFields.length;

      checks.push(dataCheck);
      flags.push({
        type: "warning",
        icon: "⚠️",
        title: "Incomplete Certificate Data",
        description: `${missingFields.length} required field(s) are missing or empty.`,
        detail: `Missing: ${missingFields.join(", ")}`,
      });
    } else {
      dataCheck.passed = true;
      dataCheck.detail =
        "All required fields present: Name, Degree, Institution, Year";
      dataCheck.scoreImpact = 0;
      checks.push(dataCheck);
    }

    // ── CHECK 5: Year Validation ─────────────────
    const yearCheck = {
      name: "Graduation Year Validity",
      detail: "",
      impact: "Unrealistic years suggest data manipulation",
      scoreImpact: 0,
    };

    const currentYear = new Date().getFullYear();
    const gradYear = parseInt(cert.year);

    if (gradYear < 1980 || gradYear > currentYear) {
      yearCheck.passed = false;
      yearCheck.detail = `Year ${gradYear} is outside valid range (1980–${currentYear})`;
      yearCheck.scoreImpact = -15;
      score -= 15;

      checks.push(yearCheck);
      flags.push({
        type: "warning",
        icon: "📅",
        title: "Suspicious Graduation Year",
        description: `Graduation year ${gradYear} seems unrealistic.`,
        detail: `Valid range is 1980 to ${currentYear}.`,
      });
    } else {
      // Bonus for recent certificate
      const bonus = gradYear >= currentYear - 2 ? 5 : 0;
      yearCheck.passed = true;
      yearCheck.detail = `Year ${gradYear} is valid${bonus > 0 ? " (recent certificate — +5 bonus)" : ""}`;
      yearCheck.scoreImpact = bonus;
      score += bonus;
      checks.push(yearCheck);
    }

    // ── CHECK 6: Multi-Degree Pattern ────────────
    const multiDegreeCheck = {
      name: "Multi-Degree Pattern Analysis",
      detail: "",
      impact: "Same person with many degrees may indicate fraud",
      scoreImpact: 0,
    };

    const degreeCount = studentCerts.length;

    if (degreeCount >= 4) {
      multiDegreeCheck.passed = false;
      multiDegreeCheck.detail = `Student name "${cert.studentName}" is linked to ${degreeCount} certificates`;
      multiDegreeCheck.scoreImpact = -20;
      score -= 20;

      checks.push(multiDegreeCheck);
      flags.push({
        type: "warning",
        icon: "🎓",
        title: "Multiple Degrees Detected",
        description: `This student name is linked to ${degreeCount} certificates.`,
        detail:
          "Having 4 or more degrees under one name is unusual and may warrant manual verification.",
      });
    } else if (degreeCount >= 2) {
      multiDegreeCheck.passed = true;
      multiDegreeCheck.detail = `Student has ${degreeCount} certificate(s) — within normal range`;
      multiDegreeCheck.scoreImpact = 0;
      checks.push(multiDegreeCheck);
    } else {
      multiDegreeCheck.passed = true;
      multiDegreeCheck.detail =
        "Only 1 certificate found for this student name — looks normal";
      multiDegreeCheck.scoreImpact = 0;
      checks.push(multiDegreeCheck);
    }

    // ── CHECK 7: Bulk Issuing Detection ──────────
    const bulkCheck = {
      name: "Issuer Volume Analysis",
      detail: "",
      impact: "Unusually high volumes may indicate a compromised issuer",
      scoreImpact: 0,
    };

    const issuerTotal = issuerCerts.length;

    if (issuerTotal > 100) {
      bulkCheck.passed = false;
      bulkCheck.detail = `Issuer has issued ${issuerTotal} certificates — very high volume`;
      bulkCheck.scoreImpact = -15;
      score -= 15;

      checks.push(bulkCheck);
      flags.push({
        type: "warning",
        icon: "📊",
        title: "High Volume Issuer",
        description: `This issuer wallet has issued ${issuerTotal} certificates.`,
        detail:
          "Unusually high certificate volumes can indicate automated or fraudulent bulk issuance.",
      });
    } else if (issuerTotal > 50) {
      bulkCheck.passed = true;
      bulkCheck.detail = `Issuer has issued ${issuerTotal} certificates — moderate volume, within range`;
      bulkCheck.scoreImpact = 0;
      checks.push(bulkCheck);
      flags.push({
        type: "safe",
        icon: "ℹ️",
        title: "Moderate Issuer Volume",
        description: `Issuer has ${issuerTotal} total certificates issued.`,
        detail: "This is within an acceptable range for an active institution.",
      });
    } else {
      bulkCheck.passed = true;
      bulkCheck.detail = `Issuer has issued ${issuerTotal} certificate(s) — normal volume`;
      bulkCheck.scoreImpact = 0;
      checks.push(bulkCheck);
    }

    // ── CHECK 8: Issuer Address Validity ─────────
    const issuerCheck = {
      name: "Issuer Wallet Validity",
      detail: "",
      impact: "Invalid issuer address indicates data corruption",
      scoreImpact: 0,
    };

    const isValidAddress =
      cert.issuer &&
      cert.issuer !== "0x0000000000000000000000000000000000000000" &&
      cert.issuer.length === 42 &&
      cert.issuer.startsWith("0x");

    if (!isValidAddress) {
      issuerCheck.passed = false;
      issuerCheck.detail = "Issuer wallet address is invalid or zero address";
      issuerCheck.scoreImpact = -10;
      score -= 10;

      checks.push(issuerCheck);
      flags.push({
        type: "danger",
        icon: "🔑",
        title: "Invalid Issuer Address",
        description: "The issuer wallet address is missing or invalid.",
        detail:
          "A valid Ethereum address is required to authenticate the issuer.",
      });
    } else {
      issuerCheck.passed = true;
      issuerCheck.detail = `Valid Ethereum address: ${cert.issuer.slice(0, 10)}...`;
      issuerCheck.scoreImpact = 0;
      checks.push(issuerCheck);
    }

    // ── BUILD SCORE BREAKDOWN ────────────────────
    scoreBreakdown.push({
      category: "Certificate Validity",
      score: cert.isRevoked ? 0 : cert.isExpired ? 20 : 40,
      maxScore: 40,
      note: cert.isRevoked
        ? "Revoked (-80)"
        : cert.isExpired
          ? "Expired (-40)"
          : "Valid and active",
    });

    scoreBreakdown.push({
      category: "Data Quality",
      score: Math.max(0, 25 - missingFields.length * 10),
      maxScore: 25,
      note:
        missingFields.length === 0
          ? "All fields complete"
          : `${missingFields.length} field(s) missing`,
    });

    scoreBreakdown.push({
      category: "Pattern Analysis",
      score: Math.max(
        0,
        20 - (degreeCount >= 4 ? 20 : 0) - (issuerTotal > 100 ? 15 : 0),
      ),
      maxScore: 20,
      note:
        degreeCount >= 4
          ? `${degreeCount} degrees flagged`
          : issuerTotal > 100
            ? `High volume issuer (${issuerTotal})`
            : "No suspicious patterns",
    });

    scoreBreakdown.push({
      category: "Year & Format Checks",
      score:
        gradYear >= 1980 && gradYear <= currentYear
          ? 15 + (gradYear >= currentYear - 2 ? 5 : 0)
          : 0,
      maxScore: 20,
      note:
        gradYear < 1980 || gradYear > currentYear
          ? `Year ${gradYear} is invalid`
          : gradYear >= currentYear - 2
            ? `Year ${gradYear} is recent (+5 bonus)`
            : `Year ${gradYear} is valid`,
    });

    // Cap score between 0 and 100
    score = Math.max(0, Math.min(100, score));

    return this._buildResult(
      score,
      checks,
      flags,
      scoreBreakdown,
      cert,
      certId,
    );
  },

  // ──────────────────────────────────────────
  //  SIMPLE ANALYSIS (for Public User)
  //  Returns just a label: "safe" | "warning" | "risky"
  // ──────────────────────────────────────────

  analyzeSimple({ certId, cert }) {
    // Not found or invalid
    if (!cert || !cert.exists) return { label: "risky" };

    // Revoked
    if (cert.isRevoked) return { label: "risky" };

    // Expired
    if (cert.isExpired) return { label: "risky" };

    // Not valid
    if (!cert.isValid) return { label: "risky" };

    // Check for missing data
    const hasAllData =
      cert.studentName && cert.degree && cert.institution && cert.year;

    if (!hasAllData) return { label: "warning" };

    // Check year range
    const gradYear = parseInt(cert.year);
    const currentYear = new Date().getFullYear();
    if (gradYear < 1980 || gradYear > currentYear) {
      return { label: "warning" };
    }

    // All checks passed
    return { label: "safe" };
  },

  // ──────────────────────────────────────────
  //  BUILD FINAL RESULT OBJECT
  // ──────────────────────────────────────────

  _buildResult(score, checks, flags, scoreBreakdown, cert, certId) {
    // Safety: ensure arrays are never undefined
    checks = checks || [];
    flags = flags || [];
    scoreBreakdown = scoreBreakdown || [];

    // Cap score
    score = Math.max(0, Math.min(100, score));

    const riskLevel =
      score >= 80 ? "Safe" : score >= 50 ? "Medium Risk" : "High Risk";

    const summary = this._buildSummary(score, riskLevel, cert, flags);
    const recommendation = this._buildRecommendation(riskLevel, cert, flags);

    return {
      score,
      riskLevel,
      summary,
      recommendation,
      checks,
      flags,
      scoreBreakdown,
      analyzedAt: new Date().toISOString(),
    };
  },

  // ──────────────────────────────────────────
  //  BUILD SUMMARY TEXT
  // ──────────────────────────────────────────

  _buildSummary(score, riskLevel, cert, flags) {
    if (!cert || !cert.exists) {
      return "❌ Certificate not found on the blockchain — likely invalid or fake.";
    }
    if (cert.isRevoked) {
      return "🚫 This certificate has been officially revoked by the issuing institution.";
    }
    if (cert.isExpired) {
      return `⏰ This certificate expired on ${cert.expiryDate} and is no longer valid.`;
    }
    if (riskLevel === "Safe") {
      return `✅ Certificate is valid and passed all ${
        flags.length === 0
          ? "checks with no suspicious patterns detected"
          : "major checks with minor informational notes"
      }.`;
    }
    if (riskLevel === "Medium Risk") {
      return `⚠️ Certificate exists but ${flags.length} concern(s) were flagged during analysis. Manual verification recommended.`;
    }
    return `🚨 Certificate has ${flags.length} serious issue(s). High fraud risk detected — do not trust without direct institutional verification.`;
  },

  // ──────────────────────────────────────────
  //  BUILD RECOMMENDATION TEXT
  // ──────────────────────────────────────────

  _buildRecommendation(riskLevel, cert, flags) {
    if (!cert || !cert.exists) {
      return "Do not accept this certificate. The ID provided does not match any record on the Sepolia blockchain. Ask the candidate to provide the correct Certificate ID or contact the institution directly.";
    }
    if (cert.isRevoked) {
      return "This certificate is no longer valid. The institution has revoked it, which could mean it was issued in error, the student was expelled, or fraud was detected. Contact the institution for clarification before making any hiring decision.";
    }
    if (cert.isExpired) {
      return "This certificate had an expiry date set by the issuer that has now passed. Depending on your use case, you may still wish to verify the candidate's qualifications directly with the institution.";
    }
    if (riskLevel === "Safe") {
      return "This certificate appears authentic and trustworthy. It was found on the blockchain, has not been revoked, and passed all fraud detection checks. You may proceed with confidence, though direct institutional confirmation is always best practice for critical decisions.";
    }
    if (riskLevel === "Medium Risk") {
      const flagTitles = flags
        .filter((f) => f.type !== "safe")
        .map((f) => f.title)
        .join(", ");
      return `Some concerns were flagged: ${flagTitles}. The certificate does exist on the blockchain but we recommend contacting the issuing institution directly to confirm the details before making a final decision.`;
    }
    return "Multiple serious issues were detected with this certificate. We strongly recommend not accepting this certificate without direct written confirmation from the issuing institution. Do not rely on this certificate alone for any important decision.";
  },
};
