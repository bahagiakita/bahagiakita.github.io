/**
 * File & Environment Inspection Helpers for E2E Tests
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(__dirname, '../..');

export function getProjectPath(relativePath) {
  return path.join(PROJECT_ROOT, relativePath);
}

export function fileExists(relativePath) {
  return fs.existsSync(getProjectPath(relativePath));
}

export function readProjectFile(relativePath) {
  const fullPath = getProjectPath(relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${relativePath} (at ${fullPath})`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

export function readJsonFile(relativePath) {
  const content = readProjectFile(relativePath);
  try {
    return JSON.parse(content);
  } catch (err) {
    throw new Error(`Failed to parse JSON from ${relativePath}: ${err.message}`);
  }
}
