# Client Onboarding Checklist (Embedded Analytics)

## 1) Identity & Access

- [ ] Confirm primary IdP (Entra ID, Okta, Ping, etc.).
- [ ] Define SSO pattern (OIDC/SAML) and MFA baseline.
- [ ] Map client user groups to analytics roles (`viewer`, `analyst`, `admin`).
- [ ] Obtain tenant identifiers and group object IDs.
- [ ] Validate JIT provisioning and deprovisioning expectations.

## 2) Domains & DNS

- [ ] Confirm production vanity domain and certificate owner.
- [ ] Validate CNAME strategy for Power Pages hostnames.
- [ ] Confirm WAF/CDN requirements and allowed origin policy.
- [ ] Document CSP and iframe embedding constraints.

## 3) Legal & Compliance

- [ ] Execute MSA/SOW and data processing addendum.
- [ ] Confirm data residency requirements.
- [ ] Confirm retention, legal hold, and deletion windows.
- [ ] Capture approved subprocessors and cross-border transfer terms.

## 4) Security & Risk

- [ ] Complete security questionnaire and architecture review.
- [ ] Align incident severity matrix and response SLAs.
- [ ] Configure log forwarding and monitoring contacts.
- [ ] Validate penetration test and vulnerability management cadence.

## 5) SLA & Operating Model

- [ ] Confirm support hours and escalation path.
- [ ] Define RTO/RPO commitments.
- [ ] Agree deployment/change windows.
- [ ] Finalize monthly service review cadence.
