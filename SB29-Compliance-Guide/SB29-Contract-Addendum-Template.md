# Ohio SB 29 Compliance - Contract Addendum Template
## LanguageBridge Translation Services Agreement

**This Addendum is incorporated into and made part of the agreement between [School District Name] ("District") and LanguageBridge, LLC ("Provider") for the provision of translation and text-to-speech services via the LanguageBridge Chrome extension ("Services").**

---

## OHIO SENATE BILL 29 COMPLIANCE PROVISIONS

Effective Date: [Insert Date]

### I. DEFINITIONS

For purposes of this Addendum:

**"Educational Records"** means records directly related to a student and maintained by the District or a party acting for the District, as defined by the Family Educational Rights and Privacy Act (FERPA), 20 U.S.C. § 1232g, and Ohio Revised Code § 3319.321.

**"Student Data"** means any data, whether gathered by Provider or provided by District, that is descriptive of a student, including but not limited to:
- Student name and identifiers
- Student educational records
- Student performance or achievement data
- Student assessment results
- Student demographic information

**"Technology Provider"** means LanguageBridge, LLC, a company providing translation and text-to-speech services to support English Language Learner (ELL) instruction.

**"Services"** means the LanguageBridge Chrome extension and associated serverless backend infrastructure that provides real-time translation, text-to-speech, and speech-to-text capabilities.

---

### II. DATA PROTECTION & PRIVACY

#### A. Educational Records Ownership

1. **District Ownership:** All Student Data and Educational Records shall remain the exclusive property of the District. Provider makes no claim of ownership to any Student Data or Educational Records processed through the Services.

2. **Limited Processing:** Provider may process Educational Records only to the extent necessary to provide the Services requested by the District. Provider shall not use, disclose, or retain Educational Records for any purpose other than providing the Services.

3. **No Data Retention:** Provider shall not store, log, or retain Educational Records. All translation requests shall be processed ephemerally (in real-time) and immediately discarded upon completion.

#### B. Prohibition on Selling or Sharing Data

1. **No Data Selling:** Provider shall not sell, rent, lease, or trade Student Data or Educational Records to any third party.

2. **No Commercial Use:** Provider shall not use Student Data or Educational Records for advertising, marketing, product development, or any commercial purpose unrelated to providing the Services.

3. **No Third-Party Sharing:** Provider shall not share, disclose, or transfer Student Data or Educational Records to any third party, except:
   - As required by applicable law or court order
   - As necessary to provide the Services (e.g., processing through Microsoft Azure Cognitive Services, which operates as a FERPA-compliant "School Official")
   - With explicit written consent from the District

4. **Subprocessor Disclosure:** Provider currently uses the following subprocessors:
   - **Microsoft Azure Cognitive Services** (FERPA-compliant translation and speech processing)
   - **Netlify** (SOC 2 Type II certified serverless infrastructure)

   Provider shall notify District at least 30 days before adding new subprocessors that will have access to Student Data.

#### C. Restriction on Unauthorized Access

1. **Authorized Access Only:** Provider's employees and contractors shall access Educational Records only as necessary to fulfill their official duties in providing the Services.

2. **No Human Review:** Provider shall not permit any employee, contractor, or agent to manually review, inspect, or access Educational Records or translated content. All processing shall be automated.

3. **Technical Access Controls:** Provider shall implement technical and organizational measures to prevent unauthorized access to Educational Records, including:
   - Server-side API key storage (keys not accessible to client applications)
   - Role-based access controls (RBAC)
   - Principle of least privilege
   - Automated processing only (no human-in-the-loop)

#### D. Data Minimization

1. **Minimal Data Collection:** Provider shall collect only the minimum data necessary to provide the Services. Currently, Provider collects:
   - Anonymous user identifiers (IP-based or extension ID, no PII)
   - Usage statistics (translation count, character count, language pairs)
   - Error logs (for troubleshooting, no PII)

2. **No PII Collection:** Provider shall not collect personally identifiable information (PII) about students, including:
   - Student names or identifiers
   - Student ID numbers
   - Email addresses
   - Phone numbers
   - School or classroom identifiers
   - Teacher identifiers

3. **Data Retention Limits:** Provider shall retain usage data for no more than 24 hours (except aggregate statistics with no PII, which may be retained for service improvement).

---

### III. FERPA COMPLIANCE

#### A. School Official Status

1. **FERPA Designation:** Provider agrees to operate as a "School Official" under FERPA (20 U.S.C. § 1232g) with a legitimate educational interest in accessing Educational Records solely to provide the Services.

2. **FERPA Obligations:** Provider shall:
   - Use Educational Records only for the purpose of providing the Services
   - Not disclose Educational Records to unauthorized parties
   - Maintain security and confidentiality of Educational Records
   - Comply with all FERPA requirements applicable to School Officials

3. **FERPA Training:** Provider shall ensure that employees and contractors with potential access to Educational Records receive FERPA training.

#### B. Parental Rights

1. **Directory Information:** Provider acknowledges that the District may designate certain Student Data as "directory information" under FERPA. Provider shall comply with District policies regarding directory information.

2. **Parent Opt-Out:** Provider shall honor parent opt-out requests communicated by the District. If a parent opts their child out of using the Services, Provider shall immediately cease processing any data for that student.

3. **Parent Access:** Provider shall cooperate with the District to facilitate parent rights under FERPA, including inspection and review of Educational Records.

---

### IV. DATA SECURITY

#### A. Security Measures

Provider shall implement and maintain industry-standard administrative, physical, and technical safeguards to protect Student Data and Educational Records, including:

1. **Encryption:**
   - Data in transit: TLS 1.2 or higher encryption for all network communications
   - Data at rest: Not applicable (Provider does not store Educational Records)

2. **Access Controls:**
   - Multi-factor authentication (MFA) for administrative access
   - Role-based access controls (RBAC)
   - Audit logging of access to systems and data

3. **Network Security:**
   - Firewalls and intrusion detection/prevention systems (IDS/IPS)
   - Regular vulnerability scanning and penetration testing
   - Web application firewall (WAF) for API endpoints

4. **Application Security:**
   - Input validation and sanitization
   - Rate limiting and quota management
   - Protection against OWASP Top 10 vulnerabilities

5. **Infrastructure Security:**
   - SOC 2 Type II certified cloud providers (Azure, Netlify)
   - Regular security patches and updates
   - Secure software development lifecycle (SDLC)

#### B. Compliance Certifications

Provider represents that its infrastructure and subprocessors maintain the following certifications:

- **Microsoft Azure:** FERPA, COPPA, SOC 2 Type II, ISO 27001, HIPAA, GDPR
- **Netlify:** SOC 2 Type II, ISO 27001, GDPR

Provider shall maintain these certifications throughout the term of this Agreement and provide evidence of certification upon District request.

#### C. Security Audits

1. **Third-Party Audits:** Provider shall conduct annual third-party security audits and provide summary reports to the District upon request.

2. **Vulnerability Remediation:** Provider shall remediate critical and high-severity vulnerabilities within 30 days of discovery.

3. **District Audits:** Upon reasonable notice, District may audit Provider's compliance with this Addendum. Provider shall cooperate with such audits and provide requested documentation.

---

### V. DATA BREACH NOTIFICATION

#### A. Breach Definition

A "Data Breach" means unauthorized access to, disclosure of, or acquisition of Student Data or Educational Records that compromises the security, confidentiality, or integrity of such data.

#### B. Notification Requirements

1. **72-Hour Notification:** In the event of a Data Breach, Provider shall notify the District within **72 hours** of discovery.

2. **Notification Method:** Provider shall notify the District via:
   - **Email:** [District Privacy Officer Email]
   - **Phone:** [District Privacy Officer Phone]
   - **Emergency Contact:** Available 24/7

3. **Notification Content:** The breach notification shall include:
   - Date and time of the breach (or estimated range)
   - Description of the breach and how it occurred
   - Type of Student Data or Educational Records affected
   - Number and identification of affected students (if known)
   - Actions taken to contain and remediate the breach
   - Recommended actions for the District and parents
   - Contact information for Provider's breach response team

#### C. Breach Response Obligations

1. **Immediate Containment:** Provider shall immediately take steps to contain and mitigate the breach, including:
   - Isolating affected systems
   - Stopping unauthorized access
   - Preserving forensic evidence

2. **Investigation:** Provider shall conduct a thorough investigation to determine the cause, scope, and impact of the breach.

3. **Remediation:** Provider shall implement corrective measures to prevent recurrence, including:
   - Patching vulnerabilities
   - Enhancing security controls
   - Improving monitoring and detection capabilities

4. **Cooperation:** Provider shall cooperate with District, law enforcement, and regulatory authorities in investigating and responding to the breach.

5. **Cost Responsibility:** Provider shall bear the reasonable costs of breach notification to parents and affected individuals, credit monitoring services (if applicable), and other remediation efforts, except to the extent the breach resulted from District's negligence or misconduct.

---

### VI. MONITORING LIMITATIONS (OHIO SB 29)

#### A. Prohibited Monitoring

In compliance with Ohio Revised Code § 3319.321, Provider shall NOT:

1. **Location Tracking:** Monitor or track student location using GPS, IP geolocation, or other location-tracking technologies.

2. **Keystroke Logging:** Monitor, record, or log student keystrokes or typing patterns.

3. **Browsing History:** Track, monitor, or record student web browsing history or navigation patterns.

4. **Screen Monitoring:** Capture, record, or monitor student screen content, except for text manually selected by students for translation.

5. **Passive Audio/Visual Monitoring:** Activate microphone or camera features without explicit student action (e.g., clicking microphone or speaker button).

#### B. Permitted Activities

The following activities are expressly permitted under Ohio SB 29 exceptions:

1. **Student-Initiated Translation:** Processing text selected by students for translation (requires manual selection by student).

2. **Text-to-Speech (On-Demand):** Synthesizing speech when student clicks speaker icon to hear translation read aloud.

3. **Speech-to-Text (On-Demand):** Transcribing audio when student clicks microphone button to use "Talk to Teacher" voice translator.

4. **Anonymous Usage Statistics:** Collecting aggregate, anonymous usage data (translation counts, language pairs, character counts) for operational purposes (rate limiting, quota management, cost tracking).

5. **Error Logging:** Logging technical errors for troubleshooting (no PII or Educational Records content included in logs).

#### C. Transparency

Provider shall maintain transparency about monitoring limitations by:
- Publishing a privacy policy explaining data practices
- Providing this SB 29 compliance guide to District
- Responding to parent and student questions about privacy

---

### VII. PARENTAL RIGHTS & TRANSPARENCY

#### A. Annual Notification

1. **District Obligation:** District shall provide annual notice to parents about Provider's Services and data practices, as required by Ohio SB 29.

2. **Provider Support:** Provider shall supply District with template parent notification letters and SB 29 compliance documentation to facilitate parent notification.

#### B. Contract Inspection

1. **Parent Access:** District shall make this Agreement, including this Addendum, available for inspection by parents upon request, in accordance with Ohio SB 29.

2. **Redactions:** District may redact commercially sensitive information (e.g., pricing) before providing contract to parents, provided that data privacy and security provisions remain unredacted.

#### C. Opt-Out Rights

1. **Parent Opt-Out:** Parents have the right to request that their child not use Provider's Services.

2. **District Processing:** District shall process opt-out requests and notify Provider of students who have opted out.

3. **Provider Compliance:** Upon notification of opt-out, Provider shall immediately cease processing any data for the opted-out student.

---

### VIII. CONTRACT TERMINATION & DATA DELETION

#### A. Termination

Either party may terminate this Agreement upon [30/60/90] days' written notice. District may terminate immediately for Provider's material breach of this Addendum.

#### B. Data Deletion Upon Termination

1. **Immediate Cessation:** Upon termination, Provider shall immediately cease all access to and processing of Student Data and Educational Records.

2. **Data Deletion:** Within 30 days of termination, Provider shall:
   - Delete all Student Data and Educational Records in Provider's possession
   - Delete all Student Data and Educational Records from subprocessor systems (Azure, Netlify)
   - Certify in writing to District that all Student Data has been deleted

3. **Exception:** Provider may retain aggregate, de-identified usage statistics that contain no PII and cannot be used to identify individual students.

#### C. Certification

Provider shall provide District with written certification of data deletion, signed by an authorized officer, confirming:
- All Student Data and Educational Records have been deleted
- Subprocessors have deleted all Student Data and Educational Records
- Only de-identified aggregate statistics (if any) are retained

---

### IX. INDEMNIFICATION

Provider shall indemnify, defend, and hold harmless District, its officers, employees, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to:

1. Provider's breach of this Addendum
2. Provider's violation of FERPA, COPPA, Ohio SB 29, or other applicable privacy laws
3. Unauthorized access to, disclosure of, or use of Student Data or Educational Records by Provider or its subprocessors
4. Data Breaches caused by Provider's negligence or misconduct

---

### X. LIMITATION OF LIABILITY

Notwithstanding any limitation of liability provisions in the main Agreement, Provider's liability for breaches of data security or privacy obligations under this Addendum shall not be limited. Provider shall be fully liable for damages resulting from:

- Data Breaches
- Unauthorized disclosure of Student Data or Educational Records
- Violations of FERPA, COPPA, or Ohio SB 29

---

### XI. GOVERNING LAW & JURISDICTION

This Addendum shall be governed by the laws of the State of Ohio. Any disputes arising out of or related to this Addendum shall be resolved in the state or federal courts located in [County], Ohio.

---

### XII. COMPLIANCE WITH APPLICABLE LAWS

Provider shall comply with all applicable federal, state, and local laws, including:

- Family Educational Rights and Privacy Act (FERPA), 20 U.S.C. § 1232g
- Children's Online Privacy Protection Act (COPPA), 15 U.S.C. § 6501 et seq.
- Ohio Senate Bill 29 (Ohio Revised Code § 3319.321)
- Protection of Pupil Rights Amendment (PPRA), 20 U.S.C. § 1232h
- Individuals with Disabilities Education Act (IDEA), 20 U.S.C. § 1400 et seq.
- Section 504 of the Rehabilitation Act, 29 U.S.C. § 794
- Americans with Disabilities Act (ADA), 42 U.S.C. § 12101 et seq.

---

### XIII. ENTIRE ADDENDUM

This Addendum, together with the main Agreement, constitutes the entire agreement between the parties regarding Ohio SB 29 compliance and supersedes all prior or contemporaneous agreements, representations, and understandings.

---

### XIV. AMENDMENTS

This Addendum may be amended only by written agreement signed by authorized representatives of both parties. Provider shall notify District at least 30 days before making changes to data practices that would affect compliance with this Addendum.

---

### XV. SEVERABILITY

If any provision of this Addendum is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.

---

### XVI. SURVIVAL

The following provisions shall survive termination of this Agreement:
- Section II (Data Protection & Privacy)
- Section V (Data Breach Notification)
- Section VIII (Contract Termination & Data Deletion)
- Section IX (Indemnification)
- Section X (Limitation of Liability)

---

### XVII. CONTACT INFORMATION

**Provider Contact for SB 29 Compliance:**

LanguageBridge, LLC
**General Inquiries:** info@languagebridge.app | 216-800-6020
**Chief Technology Officer:** P. Howard | prentice@languagebridge.app | 216-800-6020
**Data Breach Emergency Contact:** P. Howard | 216-800-6020 (24/7)

**District Contact:**

[School District Name]
**Privacy Officer:** [Name] | [Email] | [Phone]
**Technology Coordinator:** [Name] | [Email] | [Phone]
**Superintendent:** [Name] | [Email] | [Phone]

---

## SIGNATURES

**IN WITNESS WHEREOF**, the parties have executed this Addendum as of the date first written above.

---

**LANGUAGEBRIDGE, LLC (Provider)**

Signature: _________________________________
Name: P. Howard
Title: Chief Technology Officer
Date: _________________

---

**[SCHOOL DISTRICT NAME] (District)**

Signature: _________________________________
Name: [Superintendent or Authorized Representative]
Title: [Title]
Date: _________________

---

**BOARD APPROVAL (if required):**

This Addendum was approved by the [School District Name] Board of Education on [Date] by Resolution No. [Number].

Board President Signature: _________________________________
Date: _________________

---

**ATTACHMENT A:** LanguageBridge SB 29 Compliance Guide
**ATTACHMENT B:** LanguageBridge Privacy Policy
**ATTACHMENT C:** Microsoft Azure FERPA Compliance Documentation
**ATTACHMENT D:** Netlify SOC 2 Type II Report (Summary)

---

**© 2026 LanguageBridge, LLC. This template is provided for informational purposes. School districts should consult with legal counsel before executing contracts.**
