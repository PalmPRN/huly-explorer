import dotenv from 'dotenv';

import path from 'path';

// Load environment variables from the .env file in the project root explicitly resolving its absolute path
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export interface HulyConfig {
  url: string;
  workspace: string;
  auth: {
    token?: string;
    email?: string;
    password?: string;
  };
}

/**
 * Loads and validates Huly configuration from environment variables.
 * Throws detailed errors to assist in debugging configuration issues.
 */
export function getHulyConfig(): HulyConfig {
  const url = process.env.HULY_URL || 'https://huly.app';
  const workspace = process.env.HULY_WORKSPACE;
  const token = process.env.HULY_TOKEN;
  const email = process.env.HULY_EMAIL;
  const password = process.env.HULY_PASSWORD;

  // STEP 1: Verify workspace name is provided.
  // The client must know which workspace workspace context to perform calls in.
  if (!workspace) {
    throw new Error(
      'HULY_WORKSPACE environment variable is missing. ' +
      'Please copy .env.example to .env and configure HULY_WORKSPACE.'
    );
  }

  // STEP 2: Verify authentication credentials.
  // Huly API supports either a personal token or email & password credentials.
  if (token) {
    return {
      url,
      workspace,
      auth: { token }
    };
  }

  if (email && password) {
    return {
      url,
      workspace,
      auth: { email, password }
    };
  }

  throw new Error(
    'Missing credentials! Please provide either HULY_TOKEN or BOTH HULY_EMAIL and HULY_PASSWORD in your .env file.'
  );
}
