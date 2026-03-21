// ================================================================
//  config.js — Contract Address + ABI
//  IMPORTANT: Replace CONTRACT_ADDRESS with your deployed address
// ================================================================

const CONTRACT_ADDRESS = "0x32C0B218930A91B33C65eC1D8b3fdE50A42B7E9d";

const CONTRACT_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "certId", type: "string" },
      { indexed: false, name: "studentName", type: "string" },
      { indexed: false, name: "degree", type: "string" },
      { indexed: false, name: "institution", type: "string" },
      { indexed: false, name: "year", type: "uint16" },
      { indexed: true, name: "issuer", type: "address" },
      { indexed: false, name: "issueDate", type: "uint256" },
      { indexed: false, name: "expiryDate", type: "uint256" },
    ],
    name: "CertificateIssued",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "certId", type: "string" },
      { indexed: true, name: "revokedBy", type: "address" },
      { indexed: false, name: "revokedAt", type: "uint256" },
    ],
    name: "CertificateRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "certId", type: "string" },
      { indexed: true, name: "verifiedBy", type: "address" },
      { indexed: false, name: "verifiedAt", type: "uint256" },
    ],
    name: "CertificateVerified",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "issuer", type: "address" },
      { indexed: false, name: "institutionName", type: "string" },
    ],
    name: "IssuerProfileUpdated",
    type: "event",
  },
  {
    inputs: [{ name: "_certId", type: "string" }],
    name: "certIdExists",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_certId", type: "string" }],
    name: "getCertificate",
    outputs: [
      { name: "exists", type: "bool" },
      { name: "isRevoked", type: "bool" },
      { name: "studentName", type: "string" },
      { name: "degree", type: "string" },
      { name: "institution", type: "string" },
      { name: "year", type: "uint16" },
      { name: "issueDate", type: "uint256" },
      { name: "expiryDate", type: "uint256" },
      { name: "issuer", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "index", type: "uint256" }],
    name: "getCertIdByIndex",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_issuer", type: "address" }],
    name: "getCertsByIssuer",
    outputs: [{ name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_name", type: "string" }],
    name: "getCertsByStudentName",
    outputs: [{ name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_issuer", type: "address" }],
    name: "getIssuerProfile",
    outputs: [
      { name: "institutionName", type: "string" },
      { name: "logoHash", type: "string" },
      { name: "isRegistered", type: "bool" },
      { name: "totalIssued", type: "uint256" },
      { name: "totalRevoked", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalCertificates",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "_certId", type: "string" },
      { name: "_name", type: "string" },
      { name: "_degree", type: "string" },
      { name: "_institution", type: "string" },
      { name: "_year", type: "uint16" },
      { name: "_expiryDate", type: "uint256" },
    ],
    name: "issueCertificate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_certId", type: "string" }],
    name: "revokeCertificate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "_institutionName", type: "string" },
      { name: "_logoHash", type: "string" },
    ],
    name: "setIssuerProfile",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_certId", type: "string" }],
    name: "verifyCertificate",
    outputs: [
      { name: "isValid", type: "bool" },
      { name: "isRevoked", type: "bool" },
      { name: "isExpired", type: "bool" },
      { name: "studentName", type: "string" },
      { name: "degree", type: "string" },
      { name: "institution", type: "string" },
      { name: "year", type: "uint16" },
      { name: "issueDate", type: "uint256" },
      { name: "expiryDate", type: "uint256" },
      { name: "issuer", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];
