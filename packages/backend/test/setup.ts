/**
 * Jest E2E Test Setup
 * 
 * This file runs before any test code and ensures the test environment
 * is properly configured by loading .env.test which overrides .env.
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env first (base config), then .env.test (overrides)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.test'), override: true });


