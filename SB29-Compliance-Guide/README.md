# LanguageBridge Ohio SB 29 Compliance Guide Package

**Version:** 1.0
**Last Updated:** January 31, 2026
**Prepared By:** LanguageBridge, LLC

---

## Overview

This compliance guide package provides comprehensive documentation of LanguageBridge's adherence to **Ohio Senate Bill 29 (SB 29)**, which establishes student data privacy requirements for K-12 school districts and technology providers.

### Purpose

This package is designed for:
- Ohio K-12 school districts evaluating LanguageBridge for deployment
- Technology coordinators assessing vendor compliance with SB 29
- Privacy officers reviewing data protection practices
- Procurement departments conducting vendor due diligence
- Parents seeking transparency about student data handling

---

## Package Contents

### 1. **SB29-Compliance-Overview.md**
**Main compliance document** - Comprehensive guide covering:
- Overview of Ohio SB 29 requirements
- How LanguageBridge complies with each requirement
- Data collection and usage practices
- Technical infrastructure and security measures
- Breach notification protocol
- Parent and student rights
- Contract requirements
- Frequently asked questions

**Recommended for:** All stakeholders

---

### 2. **SB29-Technical-Audit.md**
**Detailed technical audit** - In-depth analysis of:
- System architecture and components
- Complete data flow mapping (translation, TTS, STT)
- Data collection audit with PII analysis
- Storage analysis (local, Netlify, Azure)
- Security controls and compliance certifications
- Third-party service audit (Azure, Netlify)
- Source code review for privacy compliance
- Compliance verification checklist

**Recommended for:** Technology coordinators, privacy officers, IT security teams

---

### 3. **SB29-Parent-Notification-Letter.md**
**Template for parent communication** - Customizable letter including:
- Description of LanguageBridge services
- Student privacy protections
- Data collection transparency
- Parent rights (inspection, opt-out)
- FAQ for parents
- Contact information

**Recommended for:** School administrators, district communications teams

**Usage:** Customize with district-specific information (district name, contact details, etc.) and send to parents annually per SB 29 requirements.

---

### 4. **SB29-Contract-Addendum-Template.md**
**SB 29-compliant contract language** - Legal template covering:
- Data protection and privacy provisions
- FERPA compliance commitments
- Prohibition on data selling/sharing
- Security requirements
- Breach notification protocol
- Monitoring limitations
- Indemnification and liability
- Termination and data deletion

**Recommended for:** Procurement officers, legal counsel, district administrators

**Usage:** Incorporate into master service agreement or use as standalone addendum. Consult with district legal counsel before execution.

---

### 5. **README.md** (This File)
**Guide to using this package**

---

## Quick Start Guide

### For School Districts Evaluating LanguageBridge

**Step 1:** Review the **SB29-Compliance-Overview.md** to understand LanguageBridge's compliance status and data practices.

**Step 2:** Share the **SB29-Technical-Audit.md** with your technology coordinator or IT security team for technical review.

**Step 3:** Provide the **SB29-Parent-Notification-Letter.md** template to your communications team for customization.

**Step 4:** Work with your procurement/legal team to incorporate the **SB29-Contract-Addendum-Template.md** into your vendor agreement.

**Step 5:** Contact LanguageBridge at info@languagebridge.app with any questions or to schedule a compliance review meeting.

---

### For Technology Coordinators

1. **Technical Review:** Read the Technical Audit document to understand data flows and security controls.
2. **Infrastructure Assessment:** Verify Azure and Netlify compliance certifications (SOC 2, FERPA, etc.).
3. **Integration Planning:** Contact LanguageBridge to discuss deployment options (district-wide, pilot, classroom-specific).
4. **Testing:** Request a pilot deployment to test functionality and compliance in your environment.

---

### For Privacy Officers

1. **Compliance Verification:** Review the Compliance Overview and Technical Audit against SB 29 requirements.
2. **Data Inventory:** Confirm LanguageBridge's minimal data collection aligns with district privacy policies.
3. **Risk Assessment:** Evaluate breach notification protocol and security measures.
4. **Parent Communication:** Customize the Parent Notification Letter template for your district.
5. **Contract Review:** Work with legal counsel to review and execute the Contract Addendum.

---

### For Procurement Officers

1. **Vendor Due Diligence:** Use this package as evidence of SB 29 compliance during procurement process.
2. **Contract Negotiation:** Leverage the Contract Addendum template in vendor agreement discussions.
3. **Budget Planning:** Contact LanguageBridge for pricing information (info@languagebridge.app).
4. **References:** Request references from other Ohio districts using LanguageBridge (available upon request).

---

## Ohio SB 29 Compliance Summary

### ✅ LanguageBridge is FULLY COMPLIANT with Ohio SB 29

| Requirement | Compliant? | Summary |
|-------------|------------|---------|
| **Educational records protection** | ✅ Yes | No educational records stored; ephemeral processing only |
| **No data selling/sharing** | ✅ Yes | Zero data selling; no third-party sharing for commercial purposes |
| **Restricted employee access** | ✅ Yes | LanguageBridge employees have zero access to student data |
| **FERPA alignment** | ✅ Yes | Uses FERPA-compliant Azure; collects no PII |
| **No location tracking** | ✅ Yes | Extension does not request or use location permissions |
| **No keystroke logging** | ✅ Yes | No monitoring of keystroke activity |
| **No browsing history tracking** | ✅ Yes | Extension does not access or track browsing history |
| **No passive monitoring** | ✅ Yes | Audio features on-demand only (student-initiated) |
| **72-hour breach notification** | ✅ Yes | Written protocol established; 24/7 emergency contact |
| **Data security measures** | ✅ Yes | HTTPS encryption, SOC 2 infrastructure, FERPA-compliant processing |
| **Parent rights** | ✅ Yes | Transparent practices; opt-out available |
| **Contract requirements** | ✅ Yes | SB 29-compliant contract language provided |

**Overall Compliance: 12/12 (100%)**

---

## What Makes LanguageBridge SB 29 Compliant?

### Privacy-First Architecture

1. **No Educational Records Stored**
   - Translations processed in real-time and immediately discarded
   - No database to breach
   - Text exists only during active request (milliseconds)

2. **Minimal Data Collection**
   - Only anonymous usage statistics (no PII)
   - No student names, IDs, or identifiers
   - No translated content logged

3. **FERPA-Compliant Infrastructure**
   - Microsoft Azure operates as "School Official" under FERPA
   - Azure does not store or use student data for model training
   - SOC 2 Type II certified infrastructure

4. **No Monitoring**
   - No location tracking
   - No keystroke logging
   - No browsing history tracking
   - Audio features on-demand only (student clicks microphone/speaker)

5. **Enterprise-Grade Security**
   - HTTPS encryption (TLS 1.2+)
   - Server-side API key management
   - Rate limiting and abuse prevention
   - Daily quotas and budget caps

---

## Frequently Asked Questions

### General Questions

**Q: Who should review this compliance guide?**
A: Technology coordinators, privacy officers, procurement teams, legal counsel, and administrators evaluating LanguageBridge for Ohio school districts.

**Q: Is this guide legally binding?**
A: No. This guide provides informational documentation of LanguageBridge's compliance practices. The legally binding agreement is the Contract Addendum executed between the district and LanguageBridge.

**Q: How often is this guide updated?**
A: This guide is reviewed and updated annually or whenever there are material changes to LanguageBridge's data practices or Ohio privacy laws.

**Q: Can we share this guide with parents?**
A: Yes. This guide is designed for transparency and may be shared with parents, school board members, and other stakeholders.

### Compliance Questions

**Q: Does LanguageBridge require students to create accounts?**
A: No. LanguageBridge works immediately without requiring logins, accounts, or personal information.

**Q: What happens to student data if we terminate our contract?**
A: Since LanguageBridge does not store educational records, there is no data to delete. Students simply uninstall the extension, removing local preferences from their devices.

**Q: Can LanguageBridge employees see what students are translating?**
A: No. All translations are processed automatically by Azure AI with no human review. LanguageBridge employees have zero access to student educational records.

**Q: Is Microsoft Azure FERPA-compliant?**
A: Yes. Microsoft Azure Cognitive Services are FERPA-compliant and designed for educational use. Microsoft operates as a "School Official" under FERPA.

**Q: How does LanguageBridge handle data breaches?**
A: LanguageBridge maintains a comprehensive security incident response plan and will notify districts within 72 hours of any confirmed breach. However, since no educational records are stored, the risk is minimal.

### Procurement Questions

**Q: What is the cost of LanguageBridge?**
A: Pricing varies based on deployment size (number of students, schools). Contact info@languagebridge.app for a custom quote.

**Q: Are pilot programs available?**
A: Yes. LanguageBridge offers pilot programs for districts to evaluate the service before full deployment.

**Q: Can we customize the contract?**
A: Yes. LanguageBridge works with districts to develop custom contract terms that meet specific district requirements while maintaining SB 29 compliance.

**Q: Do you have references from other Ohio districts?**
A: Yes. References and case studies available upon request. Contact info@languagebridge.app.

---

## Next Steps

### Ready to Deploy LanguageBridge?

**Contact LanguageBridge to discuss:**
1. Pilot program setup
2. Pricing and contract terms
3. Implementation timeline
4. Teacher training and support
5. Technical integration

---

### Contact Information

**LanguageBridge, LLC**

**General Inquiries:**
- Email: info@languagebridge.app
- Phone: 216-800-6020
- Website: https://languagebridge.app

**Chief Technology Officer (Privacy & Compliance):**
- Name: P. Howard
- Email: prentice@languagebridge.app
- Phone: 216-800-6020

**Data Breach Emergency Contact:**
- P. Howard: 216-800-6020 (24/7 emergency line)

**Privacy Policy:**
- https://languagebridge.app/privacy

**Teacher Dashboard:**
- https://languagebridge.app/dashboard

---

## Additional Resources

### Ohio Department of Education
- **Student Privacy:** https://education.ohio.gov (search "student data privacy")
- **SB 29 Information:** Ohio Legislature website

### Federal Compliance
- **FERPA Overview:** https://www2.ed.gov/policy/gen/guid/fpco/ferpa/index.html
- **COPPA Guidelines:** https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa

### Microsoft Azure
- **FERPA Compliance:** https://www.microsoft.com/en-us/trust-center/compliance/ferpa
- **Azure Security:** https://azure.microsoft.com/en-us/explore/security

### LanguageBridge
- **Privacy Policy:** https://languagebridge.app/privacy
- **Support Documentation:** Available from your LanguageBridge account manager

---

## Document Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | January 31, 2026 | Initial release of SB 29 compliance guide package | LanguageBridge Compliance Team |

---

## Legal Disclaimer

**This compliance guide package is provided for informational purposes to assist Ohio school districts in evaluating LanguageBridge's compliance with Ohio Senate Bill 29. This guide does not constitute legal advice.**

**School districts should:**
- Consult with their own legal counsel before executing contracts
- Conduct their own compliance assessments based on district-specific requirements
- Review and customize the provided templates to meet local needs

**LanguageBridge, LLC makes no warranties, express or implied, regarding the completeness, accuracy, or adequacy of this guide for any particular purpose. District assumes all responsibility for decisions made based on this guide.**

---

## Copyright & License

**© 2026 LanguageBridge, LLC. All rights reserved.**

This compliance guide package is proprietary to LanguageBridge, LLC and is provided under the following terms:

- **School District Use:** Ohio school districts may use, copy, and distribute this package for purposes of evaluating LanguageBridge for deployment in their district.
- **Parent Distribution:** Districts may share this package with parents and school board members for transparency purposes.
- **No Commercial Use:** This package may not be used for commercial purposes or distributed to competitors without written permission from LanguageBridge.
- **No Modifications:** This package may not be modified, altered, or presented as the work of any party other than LanguageBridge.
- **Attribution Required:** Any distribution of this package must include attribution to LanguageBridge, LLC.

For permission requests, contact: info@languagebridge.app

---

**Thank you for considering LanguageBridge for your district's English Language Learner (ELL) support needs. We are committed to student privacy and compliance with Ohio SB 29.**

**LanguageBridge, LLC**
**Supporting English Learners with Privacy-First Translation Technology**

**info@languagebridge.app | 216-800-6020 | https://languagebridge.app**
