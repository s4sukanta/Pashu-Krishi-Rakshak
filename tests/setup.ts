/**
 * Jest setup file
 * Loads environment variables from .env.local for testing
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local file
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
