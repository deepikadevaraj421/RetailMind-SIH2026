import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', 'backend', '.env') });

import { connectDB } from '../backend/src/utils/db.js';
import { loadDatasetAndSeed } from '../backend/src/services/datasetLoader.js';

async function main() {
  console.log('=== RETAILMIND DATASET SEED SCRIPT ===');
  await connectDB();
  const res = await loadDatasetAndSeed();
  console.log('Import summary:', res.summary);
  process.exit(0);
}

main().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
