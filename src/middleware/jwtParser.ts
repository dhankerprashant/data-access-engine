import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

declare module 'express-serve-static-core' {
  interface Request {
    ldapGroups?: string[];
    simulatedUser?: string;
  }
}

interface RoleSimulations {
  [username: string]: {
    description: string;
    ldapGroups: string[];
  };
}

const secretKey = 'demo-secret';

export default function jwtParser(req: Request, res: Response, next: NextFunction): void {
  const simulationUser = req.header('x-simulate-user');

  if (simulationUser) {
    const rolePath = path.join(__dirname, '../../configs/RoleSimulations.json');
    try {
      const rawData = fs.readFileSync(rolePath, 'utf-8');
      const roleSimulations: RoleSimulations = JSON.parse(rawData);
      const userProfile = roleSimulations[simulationUser];

      if (userProfile && Array.isArray(userProfile.ldapGroups)) {
        req.ldapGroups = userProfile.ldapGroups;
        req.simulatedUser = simulationUser;
        console.log(`🎭 Simulating user: ${simulationUser} → LDAP Groups: ${userProfile.ldapGroups.join(', ')}`);
        next();
      } else {
        res.status(400).json({ error: `No simulation roles found for user: ${simulationUser}` });
      }
    } catch (err) {
      console.error('Error loading RoleSimulations.json:', err);
      res.status(500).json({ error: 'Simulation role resolution failed' });
    }
    return;
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Invalid Authorization token format' });
    return;
  }

  try {
    const payload: any = jwt.verify(token, secretKey);
    req.ldapGroups = payload.ldapGroups || [];
    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    res.status(403).json({ error: 'Invalid token' });
  }
}
