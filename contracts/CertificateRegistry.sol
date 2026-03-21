// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CertificateRegistry
 * @notice Degree Certificate Verification System
 * @dev Stores, verifies, and revokes academic certificates on blockchain
 */
contract CertificateRegistry {

    // ─────────────────────────────────────────
    //  DATA STRUCTURES
    // ─────────────────────────────────────────

    struct Certificate {
        string  studentName;   // Full name of student
        string  degree;        // Degree title
        string  institution;   // Issuing institution name
        uint16  year;          // Graduation year
        uint256 issueDate;     // Timestamp when issued
        uint256 expiryDate;    // 0 = no expiry
        address issuer;        // Wallet address of institution
        bool    isRevoked;     // Revocation flag
        bool    exists;        // Existence check flag
    }

    struct IssuerProfile {
        string  institutionName;  // College / University name
        string  logoHash;         // IPFS hash or logo identifier
        bool    isRegistered;     // Profile exists flag
        uint256 totalIssued;      // Count of issued certificates
        uint256 totalRevoked;     // Count of revoked certificates
    }

    // ─────────────────────────────────────────
    //  STATE VARIABLES
    // ─────────────────────────────────────────

    // Maps Certificate ID → Certificate data
    mapping(string => Certificate) private certificates;

    // Maps issuer wallet → their profile
    mapping(address => IssuerProfile) private issuerProfiles;

    // Maps issuer wallet → list of certificate IDs they issued
    mapping(address => string[]) private issuerCertificates;

    // Maps student name → list of cert IDs (for duplicate pattern detection)
    mapping(string => string[]) private studentCertificates;

    // Stores all certificate IDs ever issued (for global analysis)
    string[] private allCertificateIds;

    // Contract owner (deployer)
    address public owner;

    // ─────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────

    event CertificateIssued(
        string  indexed certId,
        string  studentName,
        string  degree,
        string  institution,
        uint16  year,
        address indexed issuer,
        uint256 issueDate,
        uint256 expiryDate
    );

    event CertificateRevoked(
        string  indexed certId,
        address indexed revokedBy,
        uint256 revokedAt
    );

    event CertificateVerified(
        string  indexed certId,
        address indexed verifiedBy,
        uint256 verifiedAt
    );

    event IssuerProfileUpdated(
        address indexed issuer,
        string  institutionName
    );

    // ─────────────────────────────────────────
    //  MODIFIERS
    // ─────────────────────────────────────────

    /// @dev Only the original issuer of that certificate can call
    modifier onlyIssuer(string memory certId) {
        require(certificates[certId].exists, "Certificate does not exist");
        require(
            certificates[certId].issuer == msg.sender,
            "Only the original issuer can perform this action"
        );
        _;
    }

    /// @dev Certificate must exist
    modifier certExists(string memory certId) {
        require(certificates[certId].exists, "Certificate not found");
        _;
    }

    // ─────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─────────────────────────────────────────
    //  ISSUER PROFILE FUNCTIONS
    // ─────────────────────────────────────────

    /**
     * @notice Set or update issuer profile (institution name + logo)
     * @param _institutionName Name of the college/university
     * @param _logoHash Logo identifier or IPFS hash
     */
    function setIssuerProfile(
        string memory _institutionName,
        string memory _logoHash
    ) external {
        require(bytes(_institutionName).length > 0, "Institution name required");

        IssuerProfile storage profile = issuerProfiles[msg.sender];
        profile.institutionName = _institutionName;
        profile.logoHash        = _logoHash;
        profile.isRegistered    = true;

        emit IssuerProfileUpdated(msg.sender, _institutionName);
    }

    /**
     * @notice Get issuer profile by wallet address
     */
    function getIssuerProfile(address _issuer)
        external
        view
        returns (
            string memory institutionName,
            string memory logoHash,
            bool   isRegistered,
            uint256 totalIssued,
            uint256 totalRevoked
        )
    {
        IssuerProfile storage profile = issuerProfiles[_issuer];
        return (
            profile.institutionName,
            profile.logoHash,
            profile.isRegistered,
            profile.totalIssued,
            profile.totalRevoked
        );
    }

    // ─────────────────────────────────────────
    //  CERTIFICATE ISSUANCE
    // ─────────────────────────────────────────

    /**
     * @notice Issue a new certificate on blockchain
     * @param _certId    Unique certificate ID (e.g. "CERT-2024-001")
     * @param _name      Student full name
     * @param _degree    Degree name (e.g. "B.Tech Computer Science")
     * @param _institution Institution name
     * @param _year      Graduation year
     * @param _expiryDate Unix timestamp for expiry, 0 = no expiry
     */
    function issueCertificate(
        string memory _certId,
        string memory _name,
        string memory _degree,
        string memory _institution,
        uint16        _year,
        uint256       _expiryDate
    ) external {
        // Prevent duplicate certificate IDs
        require(!certificates[_certId].exists, "Certificate ID already exists");

        // Basic input validation
        require(bytes(_certId).length > 0,    "Certificate ID is required");
        require(bytes(_name).length > 0,       "Student name is required");
        require(bytes(_degree).length > 0,     "Degree is required");
        require(bytes(_institution).length > 0,"Institution name is required");
        require(_year > 1900 && _year <= 2100, "Invalid graduation year");

        // Expiry must be in the future if provided
        if (_expiryDate > 0) {
            require(_expiryDate > block.timestamp, "Expiry date must be in the future");
        }

        // Store certificate
        certificates[_certId] = Certificate({
            studentName : _name,
            degree      : _degree,
            institution : _institution,
            year        : _year,
            issueDate   : block.timestamp,
            expiryDate  : _expiryDate,
            issuer      : msg.sender,
            isRevoked   : false,
            exists      : true
        });

        // Track for issuer
        issuerCertificates[msg.sender].push(_certId);
        issuerProfiles[msg.sender].totalIssued++;

        // Track for student name (AI pattern detection)
        studentCertificates[_name].push(_certId);

        // Add to global list
        allCertificateIds.push(_certId);

        emit CertificateIssued(
            _certId,
            _name,
            _degree,
            _institution,
            _year,
            msg.sender,
            block.timestamp,
            _expiryDate
        );
    }

    // ─────────────────────────────────────────
    //  CERTIFICATE REVOCATION
    // ─────────────────────────────────────────

    /**
     * @notice Revoke a certificate (only original issuer can do this)
     * @param _certId Certificate ID to revoke
     */
    function revokeCertificate(string memory _certId)
        external
        onlyIssuer(_certId)
    {
        require(!certificates[_certId].isRevoked, "Already revoked");

        certificates[_certId].isRevoked = true;
        issuerProfiles[msg.sender].totalRevoked++;

        emit CertificateRevoked(_certId, msg.sender, block.timestamp);
    }

    // ─────────────────────────────────────────
    //  CERTIFICATE VERIFICATION
    // ─────────────────────────────────────────

    /**
     * @notice Verify a certificate and get all its data
     * @param _certId Certificate ID to verify
     * @return isValid      True if cert exists, not revoked, not expired
     * @return isRevoked    True if issuer revoked this certificate
     * @return isExpired    True if expiry date has passed
     * @return studentName  Full name of the student
     * @return degree       Degree title
     * @return institution  Issuing institution name
     * @return year         Graduation year
     * @return issueDate    Timestamp when issued
     * @return expiryDate   Expiry timestamp (0 = no expiry)
     * @return issuer       Wallet address of the issuer
     */
    function verifyCertificate(string memory _certId)
        external
        returns (
            bool    isValid,
            bool    isRevoked,
            bool    isExpired,
            string  memory studentName,
            string  memory degree,
            string  memory institution,
            uint16  year,
            uint256 issueDate,
            uint256 expiryDate,
            address issuer
        )
    {
        // Emit verification event for audit trail
        emit CertificateVerified(_certId, msg.sender, block.timestamp);

        // Certificate doesn't exist
        if (!certificates[_certId].exists) {
            return (false, false, false, "", "", "", 0, 0, 0, address(0));
        }

        Certificate storage cert = certificates[_certId];

        // Check if expired
        bool expired = (cert.expiryDate > 0 && block.timestamp > cert.expiryDate);

        // Valid = exists + not revoked + not expired
        bool valid = !cert.isRevoked && !expired;

        return (
            valid,
            cert.isRevoked,
            expired,
            cert.studentName,
            cert.degree,
            cert.institution,
            cert.year,
            cert.issueDate,
            cert.expiryDate,
            cert.issuer
        );
    }

    /**
     * @notice Read-only certificate check (no event emitted, free call)
     */
    function getCertificate(string memory _certId)
        external
        view
        returns (
            bool    exists,
            bool    isRevoked,
            string  memory studentName,
            string  memory degree,
            string  memory institution,
            uint16  year,
            uint256 issueDate,
            uint256 expiryDate,
            address issuer
        )
    {
        Certificate storage cert = certificates[_certId];
        return (
            cert.exists,
            cert.isRevoked,
            cert.studentName,
            cert.degree,
            cert.institution,
            cert.year,
            cert.issueDate,
            cert.expiryDate,
            cert.issuer
        );
    }

    // ─────────────────────────────────────────
    //  AI SUPPORT FUNCTIONS
    // ─────────────────────────────────────────

    /**
     * @notice Get all cert IDs issued by a specific wallet
     * @dev Used by AI engine to detect bulk issuing patterns
     */
    function getCertsByIssuer(address _issuer)
        external
        view
        returns (string[] memory)
    {
        return issuerCertificates[_issuer];
    }

    /**
     * @notice Get all cert IDs linked to a student name
     * @dev Used by AI engine to detect same-name multi-degree fraud
     */
    function getCertsByStudentName(string memory _name)
        external
        view
        returns (string[] memory)
    {
        return studentCertificates[_name];
    }

    /**
     * @notice Get total number of certificates ever issued
     */
    function getTotalCertificates() external view returns (uint256) {
        return allCertificateIds.length;
    }

    /**
     * @notice Get certificate ID by global index
     * @dev Used for full audit traversal
     */
    function getCertIdByIndex(uint256 index) external view returns (string memory) {
        require(index < allCertificateIds.length, "Index out of range");
        return allCertificateIds[index];
    }

    /**
     * @notice Check if a certificate ID already exists
     */
    function certIdExists(string memory _certId) external view returns (bool) {
        return certificates[_certId].exists;
    }
}