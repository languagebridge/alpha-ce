# LanguageBridge Ohio SB 29 Compliance Guide

**Document Version:** 1.0
**Last Updated:** January 31, 2026
**Prepared For:** Ohio School Districts
**Service Provider:** LanguageBridge, LLC

---

## Executive Summary

LanguageBridge is **fully compliant** with Ohio Senate Bill 29 (SB 29), which establishes student data privacy requirements for K-12 school districts and technology providers. This guide provides comprehensive documentation of how LanguageBridge meets all SB 29 requirements.

### Key Compliance Points

✅ **Educational Records Protection** - Student educational records remain district property
✅ **Minimal Data Collection** - Only essential usage data collected (no PII)
✅ **No Data Selling** - Student data is never sold, shared, or used for commercial purposes
✅ **Secure Infrastructure** - Enterprise-grade security with Azure and Netlify
✅ **FERPA Alignment** - Compliant with federal FERPA requirements
✅ **Breach Notification** - 72-hour notification protocol in place
✅ **No Monitoring** - Extension does not track location, keystrokes, or browsing activity
✅ **Parent Rights** - Transparent practices with inspection rights

---

## Table of Contents

1. [What is Ohio SB 29?](#what-is-ohio-sb-29)
2. [How LanguageBridge Complies](#how-languagebridge-complies)
3. [Data Collection & Usage](#data-collection--usage)
4. [Technical Infrastructure](#technical-infrastructure)
5. [Security Measures](#security-measures)
6. [Breach Notification Protocol](#breach-notification-protocol)
7. [Parent & Student Rights](#parent--student-rights)
8. [Contract Requirements](#contract-requirements)
9. [Monitoring Limitations](#monitoring-limitations)
10. [Frequently Asked Questions](#frequently-asked-questions)

---

## What is Ohio SB 29?

Ohio Senate Bill 29 took effect in October 2024 and establishes comprehensive requirements for:

### Technology Provider Contracts
School districts must enter contracts with technology providers that include:
- Restrictions on unauthorized access to educational records
- Prohibition on selling, sharing, or disseminating educational records
- Limits on employee/contractor access to educational records

### Parent Notification Requirements
Districts must provide:
- Annual notice to parents about technology provider contracts
- Opportunities for parents to inspect contracts
- 72-hour breach notification if educational records are compromised

### Monitoring Limitations
Districts and technology providers have limitations on:
- Location-tracking features
- Audio/visual recording features
- Keystroke logging and web-browsing activity monitoring

### Data Ownership
- Student educational records remain district property
- Strict data breach protocols required
- Educational records definition aligns with FERPA

---

## How LanguageBridge Complies

### 1. Educational Records Protection

**SB 29 Requirement:** Educational records must remain district property and cannot be misused by technology providers.

**LanguageBridge Compliance:**
- ✅ **No Educational Records Stored** - LanguageBridge does not store, collect, or retain student educational records
- ✅ **Translation Processing Only** - Text is processed in real-time by Azure Cognitive Services and immediately discarded
- ✅ **No Content Retention** - Translated content is never logged, saved, or stored on any server
- ✅ **District Ownership** - Any data generated during use remains under district control

### 2. No Data Selling or Sharing

**SB 29 Requirement:** Technology providers are prohibited from selling, sharing, or disseminating educational records.

**LanguageBridge Compliance:**
- ✅ **Zero Data Selling** - LanguageBridge has never and will never sell student data
- ✅ **Zero Third-Party Sharing** - No student data is shared with third parties for marketing or commercial purposes
- ✅ **Limited Service Providers** - Only Microsoft Azure (FERPA-compliant) processes translations
- ✅ **No Advertising** - Extension contains no advertisements or tracking pixels

### 3. Restricted Access to Educational Records

**SB 29 Requirement:** Technology provider employees may only access educational records as necessary to fulfill official duties.

**LanguageBridge Compliance:**
- ✅ **No Human Access** - LanguageBridge employees have zero access to student educational records
- ✅ **Automated Processing** - All translations processed automatically by Azure AI services
- ✅ **No Manual Review** - No human ever reviews translated content
- ✅ **Server-Side API Keys** - API keys stored securely on Netlify (LanguageBridge employees cannot access student data)

### 4. FERPA Alignment

**SB 29 Requirement:** Definition of "educational records" aligns with FERPA.

**LanguageBridge Compliance:**
- ✅ **FERPA-Compliant Design** - LanguageBridge designed to comply with FERPA from inception
- ✅ **No PII Collection** - Does not collect personally identifiable information (PII)
- ✅ **Azure FERPA Certification** - Microsoft Azure Cognitive Services are FERPA-compliant
- ✅ **Anonymous Usage Metrics** - Only aggregate, non-identifiable usage statistics collected

### 5. Monitoring Limitations

**SB 29 Requirement:** Limitations on monitoring location-tracking, audio/visual features, keystrokes, and web-browsing.

**LanguageBridge Compliance:**
- ✅ **No Location Tracking** - Extension does not access or track student location
- ✅ **No Keystroke Logging** - Does not monitor or record keystrokes
- ✅ **No Browsing History** - Does not track web browsing activity or history
- ✅ **No Screen Recording** - Does not capture or record screen content
- ✅ **On-Demand Only** - Audio features only activate when student explicitly requests translation or speech

### 6. Data Breach Notification

**SB 29 Requirement:** 72-hour parent notification if educational records are compromised.

**LanguageBridge Compliance:**
- ✅ **Breach Protocol Established** - Written breach notification protocol in place
- ✅ **72-Hour Notification** - District notified within 72 hours of any security incident
- ✅ **Incident Response Plan** - Comprehensive security incident response plan documented
- ✅ **Microsoft Azure Security** - Enterprise-grade security infrastructure with SOC 2 Type II certification

---

## Data Collection & Usage

### What Data Does LanguageBridge Collect?

LanguageBridge collects **minimal, non-identifiable data** for operational purposes only:

#### ✅ Data We Collect (Anonymous Usage Metrics)
| Data Type | Purpose | Retention | Contains PII? |
|-----------|---------|-----------|---------------|
| **Translation requests per user** | Rate limiting & quota management | 24 hours | ❌ No |
| **Language pairs used** | Service improvement | 30 days aggregate | ❌ No |
| **Character counts** | Cost tracking & budgeting | 30 days aggregate | ❌ No |
| **Error logs** | Technical troubleshooting | 7 days | ❌ No |
| **Anonymous user ID** | Prevent abuse (IP-based or extension ID) | 24 hours | ❌ No |

#### ❌ Data We Do NOT Collect
- Student names or identifiers
- Translated text content
- Original text content
- Email addresses
- Phone numbers
- School or classroom names
- Student grades or performance data
- Browsing history
- Location data
- Device identifiers (beyond temporary session management)
- Keystroke patterns
- Screen recordings

### How is Data Used?

**Operational Purposes Only:**
1. **Rate Limiting** - Prevent abuse by limiting requests per user per minute
2. **Daily Quotas** - Track daily usage to stay within budget limits
3. **Cost Tracking** - Monitor Azure API costs for budget management
4. **Error Handling** - Troubleshoot technical issues and improve reliability
5. **Service Quality** - Aggregate statistics to improve translation quality

**Never for:**
- ❌ Marketing or advertising
- ❌ Student profiling or tracking
- ❌ Selling to third parties
- ❌ Behavioral analysis
- ❌ Cross-site tracking

### Data Lifecycle

```
Student selects text → Azure translates (real-time) → Result displayed → Text discarded
                                                                              ↓
                                                        Usage count logged (anonymous)
                                                                              ↓
                                                          Deleted after 24 hours
```

---

## Technical Infrastructure

### Architecture Overview

LanguageBridge uses a privacy-first, serverless architecture:

```
Chrome Extension (Client)
        ↓
Netlify Functions (Serverless - Ohio-compliant)
        ↓
Microsoft Azure Cognitive Services (FERPA-compliant)
        ↓
Translation/TTS Result → Returned to student → Never stored
```

### Infrastructure Components

#### 1. **Chrome Extension** (Client-Side)
- **Location:** Installed locally on student device
- **Data Storage:** Browser local storage only (no external servers)
- **Permissions:** `storage` and `activeTab` only (minimal permissions)
- **Network Access:** Only communicates with Netlify functions and Azure APIs
- **Privacy:** No third-party scripts, no analytics trackers, no ads

#### 2. **Netlify Functions** (Serverless Backend)
- **Purpose:** Secure API key management and request routing
- **Location:** Netlify global CDN (US-based datacenters available)
- **Security:** Server-side API key storage (keys never exposed to client)
- **Data Processing:** Stateless - processes requests without storing data
- **Compliance:** SOC 2 Type II certified infrastructure
- **Function Timeout:** 10 seconds (requests processed and discarded)

#### 3. **Microsoft Azure Cognitive Services**
- **Services Used:**
  - Azure Translator (text translation)
  - Azure Speech Services (text-to-speech, speech-to-text)
- **Compliance Certifications:**
  - FERPA-compliant
  - COPPA-compliant
  - SOC 2 Type II
  - ISO 27001
  - GDPR-compliant
- **Data Retention:** Azure does not store input text or translations (per Microsoft's FERPA-compliant agreement)
- **Location:** US-based datacenters (East US region)

### Data Storage Locations

| Component | Storage Type | Data Stored | Location | Retention |
|-----------|--------------|-------------|----------|-----------|
| **Chrome Extension** | Local browser storage | User preferences (language settings) | Student device | Until uninstalled |
| **Netlify Blobs** | Temporary blob storage | Anonymous usage counters | US datacenters | 24 hours (auto-deleted) |
| **Azure Cognitive Services** | None (ephemeral processing) | None - text processed in-memory only | US East region | 0 seconds (not stored) |

### Security Infrastructure

#### Network Security
- ✅ **HTTPS Encryption** - All data transmitted over encrypted HTTPS connections
- ✅ **TLS 1.2+** - Modern encryption protocols only
- ✅ **Certificate Pinning** - Validates server certificates
- ✅ **CORS Protection** - Cross-origin resource sharing restrictions

#### API Security
- ✅ **Server-Side Keys** - API keys stored on Netlify servers, never in extension code
- ✅ **Rate Limiting** - 30 requests/minute per user to prevent abuse
- ✅ **Daily Quotas** - Maximum daily limits per user
- ✅ **Budget Caps** - Pilot-wide spending limits to prevent runaway costs

#### Access Control
- ✅ **No Admin Access to Student Data** - LanguageBridge staff cannot access student data
- ✅ **No Database** - No database to hack or breach
- ✅ **Ephemeral Processing** - Data exists only during active translation request
- ✅ **Minimal Permissions** - Extension requests only essential Chrome permissions

---

## Security Measures

### Technical Security Controls

#### 1. **Encryption**
- **Data in Transit:** TLS 1.2+ encryption for all network communications
- **API Communication:** HTTPS-only connections to Netlify and Azure
- **No Data at Rest:** No student data stored = no encryption needed for storage

#### 2. **Access Controls**
- **Principle of Least Privilege:** Extension requests minimal Chrome permissions
- **No Backend Access:** LanguageBridge employees have zero access to translation data
- **Automated Processing:** All translations processed by AI with no human intervention

#### 3. **Network Security**
- **CORS Restrictions:** Only authorized origins can call Netlify functions
- **Input Validation:** All user inputs sanitized and validated
- **Rate Limiting:** Prevents abuse and denial-of-service attacks
- **Timeout Controls:** 10-second maximum request timeout

#### 4. **Monitoring & Logging**
- **Error Monitoring:** System errors logged for troubleshooting (no PII)
- **Usage Monitoring:** Anonymous aggregate statistics only
- **Security Alerts:** Automated alerts for suspicious activity
- **No Content Logging:** Translated text never logged or stored

### Compliance Certifications

#### Microsoft Azure
- ✅ FERPA-compliant
- ✅ COPPA-compliant
- ✅ SOC 2 Type II
- ✅ ISO/IEC 27001
- ✅ GDPR-compliant
- ✅ HIPAA-compliant (healthcare grade security)

#### Netlify
- ✅ SOC 2 Type II certified
- ✅ GDPR-compliant
- ✅ ISO 27001 certified
- ✅ Infrastructure hosted on AWS (FedRAMP certified)

---

## Breach Notification Protocol

LanguageBridge maintains a comprehensive breach notification protocol aligned with SB 29 requirements.

### Security Incident Response Plan

#### Phase 1: Detection (0-2 Hours)
1. **Automated Monitoring** - Systems monitored 24/7 for anomalies
2. **Alert Notification** - Security team notified immediately of potential incidents
3. **Initial Assessment** - Rapid assessment of incident severity and scope

#### Phase 2: Containment (2-12 Hours)
1. **Immediate Containment** - Isolate affected systems
2. **Stop Data Flow** - Halt any ongoing unauthorized access
3. **Preserve Evidence** - Secure logs and forensic data

#### Phase 3: Investigation (12-48 Hours)
1. **Root Cause Analysis** - Determine how breach occurred
2. **Scope Assessment** - Identify what data (if any) was compromised
3. **Impact Analysis** - Assess risk to students and districts

#### Phase 4: Notification (Within 72 Hours)
1. **District Notification** - Notify affected school districts within 72 hours
2. **Parent Notification** - Districts notify parents per SB 29 requirements
3. **Regulatory Reporting** - Report to appropriate authorities as required

#### Phase 5: Remediation (Ongoing)
1. **Security Enhancements** - Implement additional security controls
2. **System Hardening** - Patch vulnerabilities
3. **Monitoring Enhancement** - Improve detection capabilities

### Who to Contact

**In Case of Security Incident:**
- **Primary Contact:** P. Howard, CTO
- **Email:** prentice@languagebridge.app
- **Phone:** 216-800-6020
- **Emergency Hotline:** Available 24/7

### What Information We Provide

Within 72 hours of confirmed breach, districts receive:
1. **Description of Incident** - What happened and when
2. **Data Affected** - What information (if any) was compromised
3. **Students Affected** - Number and identification of affected students
4. **Remediation Steps** - What LanguageBridge has done to address the issue
5. **Recommended Actions** - What districts/parents should do
6. **Contact Information** - How to reach LanguageBridge for questions

### Current Risk Level: **MINIMAL**

**Why Risk is Minimal:**
- ✅ No student data stored on LanguageBridge servers
- ✅ Translations processed ephemerally (exist only during request)
- ✅ No database to breach
- ✅ Enterprise-grade infrastructure (Azure + Netlify)
- ✅ No PII collected

**Even if our systems were compromised:**
- Attackers would find **zero student educational records**
- No names, grades, assignments, or personal information to steal
- Only anonymous usage counters (deleted after 24 hours)

---

## Parent & Student Rights

### Transparency & Access

Under SB 29, parents have the right to:

#### ✅ **Inspect Technology Contracts**
- Parents may request to review the LanguageBridge contract with their school district
- Districts must provide access to contracts affecting student records
- LanguageBridge recommends districts maintain copies of this compliance guide for parent review

#### ✅ **Understand Data Practices**
- This compliance guide provides full transparency on data collection and usage
- Parents may contact LanguageBridge directly with questions: info@languagebridge.app
- Annual privacy policy updates available at https://languagebridge.app/privacy

#### ✅ **Opt-Out Rights**
- Parents may request their child not use LanguageBridge
- Districts maintain control over which students have access
- No penalty for opting out - alternative translation resources should be provided

### Student Rights

Students using LanguageBridge have:

#### ✅ **Right to Privacy**
- Translations are private and not shared with anyone
- No tracking of browsing history or keystrokes
- No monitoring of student activity

#### ✅ **Right to Access**
- Students can use the extension without creating an account
- No login or personal information required
- Works immediately upon installation

#### ✅ **Right to Data Deletion**
- Students can clear their local preferences anytime
- Uninstalling the extension removes all local data
- No server-side data to delete (none is stored)

### District Rights

School districts maintain:

#### ✅ **Full Control**
- Districts decide which students can install/access LanguageBridge
- Districts can disable extension use at any time
- Districts maintain ownership of all student educational records

#### ✅ **Contract Negotiation**
- Districts may request contract modifications
- Custom terms available for enterprise deployments
- Flexible deployment options (district-wide, classroom-specific, pilot programs)

#### ✅ **Usage Visibility**
- Districts can request aggregate usage reports (no individual student data)
- Budget tracking available for cost management
- Transparency into service costs and usage patterns

---

## Contract Requirements

### SB 29-Compliant Contract Language

LanguageBridge provides school districts with contract language that meets all SB 29 requirements:

#### Required Provisions (Per SB 29)

**✅ 1. Restriction on Unauthorized Access**
> "LanguageBridge, LLC and its employees and contractors shall not access student educational records except as necessary to provide translation and text-to-speech services. No employee or contractor of LanguageBridge shall access student educational records for any purpose other than fulfilling the official duties required to operate the LanguageBridge Chrome extension."

**✅ 2. Prohibition on Selling/Sharing Data**
> "LanguageBridge, LLC shall not sell, share, or disseminate student educational records to any third party, except as required by law or as necessary to provide translation services through FERPA-compliant Microsoft Azure Cognitive Services. LanguageBridge shall never use student data for advertising, marketing, or commercial purposes."

**✅ 3. Data Ownership**
> "All student educational records shall remain the exclusive property of [School District Name]. LanguageBridge makes no claim of ownership to any student data processed through the extension."

**✅ 4. FERPA Compliance**
> "LanguageBridge operates as a 'School Official' under FERPA (20 U.S.C. § 1232g) and agrees to comply with all FERPA requirements regarding the protection of student educational records."

**✅ 5. Breach Notification**
> "In the event of a data breach or unauthorized access to student educational records, LanguageBridge shall notify [School District Name] within 72 hours of discovery, providing details of the breach, affected students, and remediation steps taken."

**✅ 6. Data Security**
> "LanguageBridge shall maintain industry-standard security measures to protect student data, including encryption of data in transit (TLS 1.2+), secure API key management, rate limiting, and daily usage quotas."

**✅ 7. Monitoring Limitations**
> "LanguageBridge does not and shall not monitor student location, keystroke activity, web browsing history, screen content, or audio/visual transmissions except when explicitly activated by the student for translation purposes."

**✅ 8. Contract Termination**
> "Upon termination of this agreement, LanguageBridge shall immediately cease all processing of student data. As LanguageBridge does not store student educational records, no data deletion is necessary, but LanguageBridge shall certify that all access to district student data has ceased."

### Sample Contract Addendum

A sample SB 29-compliant contract addendum is included in this guide package:
- `SB29-Contract-Addendum-Template.pdf`

Districts may customize this template or work with LanguageBridge to develop custom contract terms.

---

## Monitoring Limitations

### SB 29 Monitoring Restrictions

Ohio SB 29 limits monitoring of:
1. **Location-tracking features**
2. **Audio or visual receiving/transmitting/recording features**
3. **Student interactions with devices (keystrokes, web-browsing)**

### How LanguageBridge Complies

#### ❌ **No Location Tracking**
- Extension does not request or access location permissions
- No GPS, IP-based location tracking, or geolocation services used
- Chrome manifest does not include `geolocation` permission

#### ❌ **No Audio/Visual Monitoring**
- **Microphone:** Only accessed when student clicks "Talk to Teacher" feature
- **Camera:** Never accessed - not requested in Chrome permissions
- **Screen Recording:** Never captured or recorded
- **Audio Recording:** Not stored or transmitted (processed in real-time only)

#### ❌ **No Keystroke or Browsing Tracking**
- Extension does not monitor keystrokes
- Does not track which websites students visit
- Does not log browsing history
- Only activates when student selects text (manual action required)

### Audio Feature Explanation

LanguageBridge includes **optional audio features** that comply with SB 29:

#### Text-to-Speech (TTS)
- **Purpose:** Read translated text aloud to student
- **Activation:** Student clicks speaker icon
- **Processing:** Text sent to Azure Speech Services, audio returned, played once
- **Storage:** Audio not stored - streamed directly to student
- **Monitoring:** Not used for monitoring - purely educational support

#### Speech-to-Text (STT) - "Talk to Teacher"
- **Purpose:** Two-way voice translator for student-teacher communication
- **Activation:** Student clicks microphone button
- **Processing:** Audio sent to Azure for transcription, text returned
- **Storage:** Audio not stored - processed in real-time only
- **Monitoring:** Not used for monitoring - active only during student-initiated conversation

### Exceptions (Per SB 29)

SB 29 allows monitoring for specific purposes. LanguageBridge operates under these exceptions:

**✅ Non-Commercial Educational Purposes**
- Translation and TTS services are purely educational
- No commercial use of student data
- Supports English Language Learner (ELL) education

**✅ Preventing Harm**
- Rate limiting prevents abuse of service
- Daily quotas prevent excessive API costs
- Anonymous usage tracking prevents system overload

**✅ Complying with State/Federal Law**
- FERPA compliance maintained
- COPPA compliance for students under 13
- SB 29 compliance in Ohio

---

## Frequently Asked Questions

### General Questions

**Q: What is LanguageBridge?**
A: LanguageBridge is a Chrome extension that provides real-time translation and text-to-speech for English learners in 9 languages. It helps students understand academic content by translating text they select on any webpage.

**Q: Who should use this compliance guide?**
A: This guide is designed for:
- Ohio K-12 school districts evaluating LanguageBridge
- Technology coordinators assessing SB 29 compliance
- Privacy officers reviewing vendor contracts
- Parents seeking transparency about student data practices

**Q: Is LanguageBridge compliant with Ohio SB 29?**
A: Yes, LanguageBridge is fully compliant with all SB 29 requirements, including data protection, breach notification, monitoring limitations, and FERPA alignment.

### Data Privacy Questions

**Q: What student data does LanguageBridge collect?**
A: LanguageBridge collects minimal, anonymous usage data only:
- Anonymous user ID (IP-based or extension ID - no names)
- Number of translations per user (for rate limiting)
- Language pairs used (aggregate statistics)
- Character counts (for cost tracking)

**What we do NOT collect:**
- Student names or identifiers
- Translated text content
- Browsing history
- Location data
- Keystroke patterns

**Q: Does LanguageBridge store the text students translate?**
A: No. Translated text is processed in real-time by Microsoft Azure and immediately discarded. No translated content is ever saved, logged, or stored on any server.

**Q: Can LanguageBridge employees see what students are translating?**
A: No. LanguageBridge employees have zero access to student educational records. All translations are processed automatically by Azure AI services with no human review.

**Q: Does LanguageBridge sell student data?**
A: Absolutely not. LanguageBridge has never and will never sell student data. This practice is prohibited by SB 29 and contradicts our mission to support English learners.

**Q: What happens to student data if a school stops using LanguageBridge?**
A: Since LanguageBridge does not store student educational records, there is no data to delete. Upon contract termination, students simply uninstall the extension, removing any local preferences from their device.

### Technical Questions

**Q: Where is student data stored?**
A: Student data is NOT stored on LanguageBridge servers. The only data storage is:
- **Student device:** Local browser storage (user preferences like language settings)
- **Netlify (temporary):** Anonymous usage counters, auto-deleted after 24 hours
- **Azure:** No storage - text processed in-memory and immediately discarded

**Q: What cloud services does LanguageBridge use?**
A: LanguageBridge uses:
- **Netlify:** Serverless functions for API routing (SOC 2 Type II certified)
- **Microsoft Azure Cognitive Services:** Translation and speech processing (FERPA-compliant)

Both providers are enterprise-grade and maintain rigorous security certifications.

**Q: Is Microsoft Azure FERPA-compliant?**
A: Yes. Microsoft Azure Cognitive Services are FERPA-compliant and designed for educational use. Microsoft's FERPA agreement ensures student data is protected and not used for commercial purposes.

**Q: Does the extension work offline?**
A: Partially. LanguageBridge includes an offline academic vocabulary glossary with Plain English definitions. However, translation and text-to-speech features require an internet connection to access Azure APIs.

### Monitoring & Privacy Questions

**Q: Does LanguageBridge track student browsing history?**
A: No. LanguageBridge does not monitor which websites students visit. The extension only activates when a student manually selects text.

**Q: Does LanguageBridge track student keystrokes?**
A: No. Keystroke logging is prohibited by SB 29, and LanguageBridge does not implement this feature.

**Q: Does LanguageBridge track student location?**
A: No. The extension does not request location permissions and never tracks where students are located.

**Q: Can teachers or administrators see what students are translating?**
A: No. LanguageBridge does not provide individual student tracking or reporting. Districts can request aggregate usage statistics (total translations, language pairs) but cannot see individual student activity.

**Q: Does the "Talk to Teacher" feature record conversations?**
A: No. The two-way voice translator processes audio in real-time through Azure Speech Services but does not record or store conversations. Audio exists only during the active translation request.

### SB 29 Specific Questions

**Q: What are the key requirements of Ohio SB 29?**
A: SB 29 requires:
- Technology provider contracts with data protection provisions
- Annual parent notification about technology contracts
- Prohibition on selling/sharing student data
- Limits on monitoring (location, keystroke, browsing)
- 72-hour breach notification
- FERPA alignment

**Q: How does LanguageBridge meet the 72-hour breach notification requirement?**
A: LanguageBridge maintains a comprehensive security incident response plan that ensures districts are notified within 72 hours of any confirmed breach. However, given that no student educational records are stored, the risk of a breach affecting student data is minimal.

**Q: Does LanguageBridge qualify as a "technology provider" under SB 29?**
A: Yes. As a Chrome extension that assists with educational content, LanguageBridge is considered a technology provider and subject to SB 29 requirements.

**Q: Can parents opt their child out of using LanguageBridge?**
A: Yes. Parents have the right to request their child not use LanguageBridge. Districts maintain control over which students have access, and alternative translation resources should be provided for students who opt out.

**Q: Does SB 29 allow LanguageBridge's text-to-speech feature?**
A: Yes. SB 29 includes exceptions for audio features used for "non-commercial educational purposes." LanguageBridge's text-to-speech feature is purely educational and supports English Language Learner (ELL) instruction.

### Contract & Procurement Questions

**Q: What contract language does LanguageBridge provide for SB 29 compliance?**
A: LanguageBridge provides a sample SB 29-compliant contract addendum that includes all required provisions:
- Data protection and security measures
- Prohibition on selling/sharing data
- Breach notification protocol
- FERPA compliance commitment
- Monitoring limitations

**Q: Can districts customize the contract?**
A: Yes. LanguageBridge works with districts to develop custom contract terms that meet specific district requirements while maintaining SB 29 compliance.

**Q: What certifications should districts request from LanguageBridge?**
A: Districts may request:
- SB 29 compliance certification (this document)
- Azure FERPA compliance documentation (available from Microsoft)
- Netlify SOC 2 Type II report
- Privacy policy and terms of service

**Q: How much does LanguageBridge cost?**
A: Pricing varies based on deployment size (number of students, schools, districts). Contact info@languagebridge.app for a custom quote. Pilot programs and grant-funded deployments available.

### Support & Contact Questions

**Q: Who do I contact with questions about SB 29 compliance?**
A: Contact LanguageBridge compliance team:
- **Email:** info@languagebridge.app
- **Phone:** 216-800-6020
- **CTO:** P. Howard (prentice@languagebridge.app)

**Q: How do I report a potential security incident?**
A: Contact P. Howard, CTO immediately:
- **Email:** prentice@languagebridge.app
- **Phone:** 216-800-6020 (24/7 emergency hotline)

**Q: Where can I find the latest privacy policy?**
A: LanguageBridge privacy policy is available at:
- https://languagebridge.app/privacy

**Q: Does LanguageBridge provide training for teachers and staff?**
A: Yes. LanguageBridge offers:
- Teacher onboarding webinars
- Administrator training on privacy and compliance
- Student tutorial videos
- Technical support documentation

---

## Contact Information

### LanguageBridge, LLC

**General Inquiries:**
- **Email:** info@languagebridge.app
- **Phone:** 216-800-6020
- **Website:** https://languagebridge.app

**Chief Technology Officer:**
- **Name:** P. Howard
- **Email:** prentice@languagebridge.app
- **Phone:** 216-800-6020

**Privacy & Compliance:**
- **Email:** info@languagebridge.app
- **Subject Line:** "SB 29 Compliance Question - [School District Name]"

**Security Incidents:**
- **Emergency Contact:** P. Howard, CTO
- **Email:** prentice@languagebridge.app
- **Phone:** 216-800-6020 (24/7)

**Teacher Dashboard & Support:**
- **Dashboard:** https://languagebridge.app/dashboard
- **Support Email:** info@languagebridge.app

---

## Document Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | January 31, 2026 | Initial release of SB 29 compliance guide | LanguageBridge Compliance Team |

---

## Additional Resources

This compliance guide package includes:

1. **SB29-Compliance-Overview.md** (this document)
2. **SB29-Technical-Audit.md** - Detailed technical audit of data flows
3. **SB29-Contract-Addendum-Template.pdf** - Sample contract language
4. **SB29-Parent-Notification-Letter.md** - Template for parent communication
5. **SB29-Data-Flow-Diagram.pdf** - Visual representation of data architecture

### External Resources

**Ohio Department of Education:**
- Ohio SB 29 Full Text: [Ohio Legislature Website](https://www.legislature.ohio.gov)
- Student Privacy Resources: [Ohio Department of Education](https://education.ohio.gov)

**Federal Compliance:**
- FERPA Overview: [U.S. Department of Education](https://www2.ed.gov/policy/gen/guid/fpco/ferpa/index.html)
- COPPA Guidelines: [FTC COPPA](https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa)

**Microsoft Azure:**
- Azure FERPA Compliance: [Microsoft Trust Center](https://www.microsoft.com/en-us/trust-center/compliance/ferpa)
- Azure Security Documentation: [Azure Security](https://azure.microsoft.com/en-us/explore/security)

---

**This document is provided for informational purposes to assist Ohio school districts in evaluating LanguageBridge's compliance with Ohio SB 29. For legal advice regarding SB 29 compliance, please consult with your district's legal counsel.**

**© 2026 LanguageBridge, LLC. All rights reserved.**
