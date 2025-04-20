import fs from 'fs';
import path from 'path';

const logPath = path.join(__dirname, '../../audit-log.jsonl');
const maxSize = 5 * 1024 * 1024; // 5 MB max

export function logAuditEvent(event: any) {
  const logEntry = JSON.stringify({ ...event, timestamp: new Date().toISOString() });

  try {
    if (fs.existsSync(logPath) && fs.statSync(logPath).size > maxSize) {
      fs.renameSync(logPath, logPath.replace('.jsonl', `-${Date.now()}.jsonl`));
    }

    fs.appendFileSync(logPath, logEntry + '\n');
  } catch (err) {
    console.error('[AuditLog] Failed to write audit event:', err);
  }
}