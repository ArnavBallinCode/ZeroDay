# Security Policy

DataMind is committed to delivering a secure, verifiable natural-language data agent. We take all security vulnerabilities seriously and appreciate the contributions of researchers and the open-source community in responsibly reporting potential vulnerabilities.

---

## Supported Versions

Only the latest release and the current `main` branch receive active security updates.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |
| `main`  | :white_check_mark: |

---

## Architectural Security Boundary & Threat Model

DataMind's core security philosophy is **defense in depth** by separating semantic intent from SQL execution:

1. **LLM Untrusted for Execution**: Google Gemma generates only a constrained, validated semantic plan JSON. Gemma **never** outputs executable SQL directly.
2. **Deterministic SQL Compiler**: Executable SQL is generated exclusively by our deterministic compiler via AST construction (using SQLGlot).
3. **Strict Table Allowlist**: The compiler strictly rejects queries referencing tables outside the allowlisted semantic model.
4. **Parameterized Queries**: All user inputs, filters, dates, and constants are bound using strict parameterized placeholders (`%(param)s`). Raw string concatenation into SQL statements is prohibited.
5. **Single Statement Enforcement**: Multi-statement execution, comments, chained queries (`BEGIN ... COMMIT`), and subquery injections are rejected prior to execution.
6. **Least Privilege Snowflake Role**: The `DATAMIND_READER` role is restricted to read-only `SELECT` permissions on explicitly granted data shares, with a dedicated, auto-suspending warehouse (`DATAMIND_WH`).

---

## Reporting a Vulnerability

**Please do not report security issues via public GitHub issues, discussions, or social media.**

To report a vulnerability:
1. Use GitHub's private vulnerability reporting feature:
   Navigate to **Security** → **Advisories** → **Report a vulnerability** on the repository.
2. Alternatively, email the maintainers directly at `maintainers@datamind.dev` with:
   - A clear description of the vulnerability.
   - Step-by-step reproduction instructions or a minimal proof of concept (PoC).
   - The affected component (e.g., API, Compiler, Frontend, Semantic Model).
   - Any potential mitigation or remediation ideas.

### Important: Protect Sensitive Credentials
- **Never** include real Snowflake passwords, private keys, PATs, session tokens, or sensitive production database contents in any report.
- Sanitize logs and config files before submitting.

---

## Response Process and SLA

When you submit a vulnerability report:

1. **Acknowledgment**: You will receive an initial response acknowledging your report within **48 hours**.
2. **Triage & Assessment**: Within **7 calendar days**, we will confirm or refute the finding, assess its severity (using CVSS v3.1), and determine remediation steps.
3. **Fix & Release**: We will develop and test a patch, keeping you updated on the progress.
4. **Coordinated Disclosure**: We adhere to responsible, coordinated disclosure. We will publish a GitHub Security Advisory and release note once the fix is deployed. You will be credited for the discovery unless you choose to remain anonymous.

---

## Safe Harbor

We consider security research conducted under this policy to be authorized. We commit to:
- Not initiating legal action against researchers for accidental, good-faith violations of this policy.
- Working with you to understand and resolve the issue quickly.
- Recognizing your contribution in our security advisories.

If you are conducting research in good faith, do not access, modify, or destroy data belonging to other users or organizations, and avoid degrading service performance.
