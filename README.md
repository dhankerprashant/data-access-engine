# 🧠 Data Access Engine – Node.js + TypeScript

This project is a deeply engineered data access policy platform inspired by **Google Zanzibar**, **Oso**, and **Amazon Cedar** — built to enforce **schema-governed, field-level access control** using a role- and group-based identity model. It supports conflict resolution, access traceability, and is being evolved toward a **graph-based rule evaluation engine** with full **auditing and explainability**.

---

## 🎯 Purpose

To build a robust, scalable, and policy-governed backend service that:
- Retrieves sensitive customer data
- Enforces **field-level access control rules**
- Resolves **conflicts** between rules from multiple roles
- Provides **traceable decisions** for every access
- Supports **schema versioning** and **safe evolution**
- Is designed for **graph-oriented access policy evaluation** in the future

---

## 📘 Design Inspiration

| Source              | Concept Adopted |
|---------------------|------------------|
| **Google Zanzibar** | Group-object-relationship abstraction, delegation graph |
| **Amazon Cedar**    | Schema-based access policy versioning and evaluation |
| **Oso**             | Role mapping to policies, policy engine extensibility |
| **DAGs**            | Directed Acyclic Graphs for rule propagation & dependency resolution |

---

## 🔐 Access Control Model

- **Users are identified via JWTs**
- **LDAP groups** extracted from the token payload
- LDAP groups mapped to **access codes**
- Each access code contains **field-level rules**
- **Conflicts resolved by strategy** (most-restrictive, least-restrictive, first-match)

---

## 📋 Supported Rule Actions

| Action             | Description                                      |
|--------------------|--------------------------------------------------|
| `hide`             | Completely removes the field from the response   |
| `mask`             | Obfuscates sensitive fields (e.g. `****1234`)    |
| `redact`           | Replaces value with `[REDACTED]`                 |
| `truncate`         | Cuts the field to a defined length               |
| `nullify`          | Replaces value with `null`                       |
| `include-only`     | Includes only specified fields in a subtree      |
| `deny-if-condition`| Removes entire subtree if condition is satisfied |

---

## ⚖️ Merge Strategies (for conflict resolution)

| Strategy          | Description                                         |
|-------------------|-----------------------------------------------------|
| `most-restrictive`| Keeps the rule that reveals the least amount of data |
| `least-restrictive`| Prefers more visible data                          |
| `first-match`     | Rule from highest-priority access code is applied   |

---

## 🧠 Schema Versioning

Each customer has:
```json
"policySchemaVersion": "v1.0"
```

Only access codes matching that version are evaluated, enabling:
- 🚫 No regression from rule upgrades
- ✅ Safe migration to future rule schema versions

---

## 🕸️ [Next Gen] Graph-Based Rule Engine (Planned)

The system is being architected to support:
- Access rules as **nodes in a graph**
- Relationships between rules (inheritance, delegation)
- Schema evolution as **versioned DAGs**
- Policy resolution using **graph traversal** (like Zanzibar)

Benefits:
- Better performance for complex policy combinations
- Allows modeling real-world delegation chains (e.g., managers, nested roles)
- Enables access justification by path (like Zanzibar's explain graph)

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

## 📂 Project Structure

```
data-access-engine-ts/
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

## 🚀 Running It

```bash
npm install
npx tsc
node dist/app.js
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

## 🧪 Test with Jest

```bash
npm install --save-dev jest ts-jest @types/jest
npx jest
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

## 👨‍💻 Maintained By

**Prashant Kumar**  
Engineer

---
