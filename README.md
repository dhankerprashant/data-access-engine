# 🧠 Data Access Engine – Node.js + TypeScript

This project is a deeply engineered data access policy platform inspired by **Google Zanzibar**, **Oso**, and **Amazon Cedar** — built to enforce **schema-governed, field-level policy-governed access controls** using a role and group-based identity model. It supports conflict resolution, meta field expansion, access traceability, and is being evolved toward a **graph-based rule evaluation engine** with full **auditing and explainability**.

---

## 🎯 Project Purpose

To build a composable and policy-aware engine that:

- Retrieves and secures structured customer data (e.g., financial, KYC, PII)
- Applies **field-level actions** (hide, mask, redact, deny, include-only)
- Supports **RBAC**, **ABAC**, and **ReBAC** through JSON policies
- Merges rules from multiple roles using configurable strategies
- Provides **traceable decisions** including **conflicts** between rules
- Enables *simulation* and override testing via headers
- Is designed for **graph-based policy evaluation and auditable security**

---

## 📘 Design Inspiration

| Source              | Concept Adopted |
|---------------------|------------------|
| **Google Zanzibar** | Group-object-relationship abstraction, delegation graph |
| **Amazon Cedar**    | Schema-based access policy versioning and evaluation |
| **OSO**             | Role mapping to policies, policy engine extensibility |
| **DAGs**            | Directed Acyclic Graphs for rule propagation & dependency resolution |

---

## 🔐 Access Control Model

- **Users are identified via JWTs**
- **LDAP groups** extracted from the token payload
- LDAP groups mapped to **access codes**
- Each access code contains **field-level rules**
- **Conflicts resolved by strategy** (most-restrictive, least-restrictive, first-match)

---

## 📚 Design Inspiration

| Source               | Feature Adapted |
|----------------------|------------------|
| **Google Zanzibar**  | Schema-governed access model |
| **OSO**              | Role mapping to policies, policy engine extensibility |
| **OPI**              | Open Policy Interop for policy execution trace |
| **DAGs**             | Directed Acyclic Graphs for rule propagation & dependency resolution |
| **Zanzibar Graphs**  | Future plan for ReBAC & hierarchy graphs |

---

## 🧩 Architecture Components

```
Client Request
   ↓
Express Middleware (JWT or Simulation Header)
   ↓
LDAP Group Resolver → Access Codes → Rules
   ↓
Rule Resolver (Merge Strategy: first-match, most-restrictive)
   ↓
Response Transformer (redact, hide, mask, deny-if, include-only)
   ↓
Transformed Response + Trace Log
```

---

## 🛡️ Access Strategies

Each rule can perform:

- `hide`: Remove field
- `nullify`: Set to null
- `redact`: Replace with `***REDACTED***`
- `mask`: Mask string based on mask type
- `truncate`: Limit field length
- `deny-if-condition`: Block entire response
- `include-only`: Return only explicitly included fields

---

## 🔁 Conflict Resolution

Access codes are assigned to users via LDAP groups. Rules are merged across multiple codes using strategies:

- `first-match`: Only the highest-priority rule is used
- `most-restrictive`: More secure transformation wins
- `least-restrictive`: More permissive action wins

All conflicts and resolutions are returned in `_conflictTrace`.

---

## 🧪 Testing & Coverage

- ✅ 90%+ line coverage with Jest
- Tests cover:
  - Rule resolution logic
  - Conflict merging
  - Path resolution with wildcards
  - Masking edge cases
- Run using: `npm test` or `npx jest --coverage`

---

## ⚙️ API Simulation & Headers

Use custom header to simulate any role in tests:

```
x-simulate-user: RiskAnalyst
```

Fallback to JWT (`Authorization: Bearer`) if simulation is not passed.

---

## 🧠 Meta Fields & Sets

Rules can use meta sets like `@PII_FIELDS`, expanded via `FieldSets.json`. These are translated during merging into concrete fields like:

```json
"@PII_FIELDS": [
  "contactInformation.email",
  "contactInformation.phone.mobile",
  "identityDocuments[i].documentNumber"
]
```

---

## 📜 Auditing & Explainability

✅ Already supported:
- `_appliedRules[]` in every API response
- `priority`, `field`, `action`, `maskType` included

🛠️ In roadmap:
- Per-request audit logs: access decision + rule source
- Exportable decision graphs for audits
- Admin dashboard to search historical rule evaluations

---
## 🧰 Dev Setup

```bash
npm install
npm run build
npm run start
npx jest --detectOpenHandles --coverage
```

Use `npm run dev` with `ts-node-dev` or `nodemon` for hot-reload dev loop.

---

## 📂 Project Structure

```
data-access-engine/
├── src/
│   ├── app.ts
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   ├── constants/
│   └── types.d.ts
├── configs/
├── tests/
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

## ✅ Output Example

```json
{
  "original": { ... },
  "transformed": { ... },
  "_appliedRules": [
    {
      "field": "contactInformation.email",
      "action": "mask",
      "maskType": "EMAIL_MASK",
      "priority": 90
    }
  ]
}
```

---

## 🔒 Security Notes

- Current: JWTs are decoded (`jwt.decode()`)
- Next: Upgrade to full HMAC verification using `jwt.verify()`
- Admin routes will include bearer-token protection for `/refresh-config` and audit tools

---

## 🌐 Future Enhancements

| Feature               | Status      |
|------------------------|-------------|
| Graph-based rule engine| 🔜 Designing |
| MongoDB config loader  | ✅ Stubbed   |
| Rule auditing & export | 🔜 Planned  |
| Schema evolution DSL   | 🔜 Future   |
| Role inheritance logic | 🔜 Possible |
| Real-time admin UI     | 🔜 Optional |

---

## 👨‍💻 **Prashant Kumar** 

---
