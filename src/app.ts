import express, { Request, Response } from 'express';
import sampleData from '../configs/SampleCustomersData.json';
import { mergeRulesWithTrace, resolveAccessCodes } from './services/ruleResolver';
import { applyRules } from './services/responseTransformer';
import jwtParser from './middleware/jwtParser';
import { logAuditEvent } from './utils/auditLogger';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/customers/:id', jwtParser, (req: Request, res: Response): void => {
  const customerId = req.params.id;
  const customer = sampleData.find((c: any) => c.customerId === customerId);

  if (!customer) {
    res.status(404).send({ error: 'Customer not found' });
    return;
  }

  const schemaVersion = customer.policySchemaVersion || 'v1.0';
  const accessCodes = resolveAccessCodes(req.ldapGroups || []);
  const { rules, conflicts } = mergeRulesWithTrace(accessCodes, schemaVersion);
  const { transformed, original, _appliedRules } = applyRules(customer, rules);
  
  logAuditEvent({
    accessedCustomerId: customerId,
    ldapGroups: req.ldapGroups,
    appliedRules: _appliedRules,
    schemaVersion
  });
  
  console.log("⬅️ API returning conflict trace:");
  console.log(JSON.stringify(conflicts, null, 2));
  
  res.json({
    transformed,
    original,
    _appliedRules,
    _conflictTrace: conflicts
  });
});

app.listen(port, () => {
  console.log(`Data Access Engine listening at http://localhost:${port}`);
});
