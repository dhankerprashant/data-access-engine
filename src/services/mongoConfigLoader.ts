import groupAccessMap from '../../configs/GroupAccessMap.json';
import accessCodeRules from '../../configs/AccessCodeRules.json';
import fieldSets from '../../configs/FieldSets.json';

let cachedConfigs: any = null;
let lastLoadTime: number = 0;
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export async function loadConfigsFromMongo(uri: string, dbName: string) {
  const now = Date.now();
  const cacheValid = cachedConfigs && (now - lastLoadTime < CACHE_DURATION_MS);

  if (cacheValid) {
    return cachedConfigs;
  }

  console.log('Cache expired or missing — loading stubbed configs from JSON.');
  cachedConfigs = {
    groupAccessMap,
    accessCodeRules,
    fieldSets
  };
  lastLoadTime = now;

  return cachedConfigs;
}