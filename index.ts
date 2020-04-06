import { docker } from './src/docker';
import * as core from '@actions/core';

async function run(): Promise<void> {
  try {
    await docker();
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
