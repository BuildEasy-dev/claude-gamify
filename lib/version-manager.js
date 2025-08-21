/**
 * Version Manager - NPM package version checking and upgrade guidance
 * Handles version detection, comparison, and execution context analysis
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

class VersionManager {
  constructor(currentVersion) {
    this.currentVersion = currentVersion;
    this.cacheFile = path.join(os.homedir(), '.claude-gamify', 'version-cache.json');
    this.CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
    this.NETWORK_TIMEOUT = 3000; // 3 seconds timeout for network requests
  }

  /**
   * Check for available updates by comparing current version with NPM registry
   * Returns update information or null if no updates available
   */
  async checkForUpdates() {
    try {
      // Check if we should skip version check due to cache
      if (await this.shouldSkipVersionCheck()) {
        return null;
      }

      const latestVersion = await this.getLatestNPMVersion();
      if (!latestVersion) {
        return null;
      }

      const updateAvailable = this.compareVersions(this.currentVersion, latestVersion);
      if (!updateAvailable) {
        // Update cache even when no update is available
        await this.updateVersionCache(latestVersion, false);
        return null;
      }

      const executionContext = this.detectExecutionContext();
      const updateInfo = {
        currentVersion: this.currentVersion,
        latestVersion: latestVersion,
        executionContext: executionContext,
        updateAvailable: true
      };

      // Cache the result
      await this.updateVersionCache(latestVersion, true);
      return updateInfo;

    } catch (error) {
      // Fail silently to avoid disrupting the main application
      return null;
    }
  }

  /**
   * Get the latest version from NPM registry
   * Uses npm command with timeout control
   */
  async getLatestNPMVersion() {
    try {
      const command = 'npm view claude-gamify version --json';
      const result = execSync(command, { 
        timeout: this.NETWORK_TIMEOUT,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'] // Suppress stderr to avoid noise
      });
      
      return JSON.parse(result.trim());
    } catch (error) {
      // Network timeout or npm command failed
      return null;
    }
  }

  /**
   * Detect how the user is executing claude-gamify
   * Returns: 'npx', 'global', or 'local'
   */
  detectExecutionContext() {
    // NPX execution - check if npm_execpath contains 'npx'
    if (process.env.npm_execpath && process.env.npm_execpath.includes('npx')) {
      return 'npx';
    }

    // Global installation - check npm_config_global
    if (process.env.npm_config_global === 'true') {
      return 'global';
    }

    // Local installation - default case
    return 'local';
  }

  /**
   * Check if we should skip version check based on cache
   * Returns true if cache is valid and recent
   */
  async shouldSkipVersionCheck() {
    try {
      const cacheData = await this.loadVersionCache();
      if (!cacheData) {
        return false;
      }

      const now = Date.now();
      const cacheAge = now - cacheData.timestamp;
      
      return cacheAge < this.CACHE_DURATION;
    } catch (error) {
      // If cache file is corrupted or doesn't exist, don't skip
      return false;
    }
  }

  /**
   * Load version cache from file
   */
  async loadVersionCache() {
    try {
      const cacheContent = await fs.readFile(this.cacheFile, 'utf8');
      return JSON.parse(cacheContent);
    } catch (error) {
      return null;
    }
  }

  /**
   * Update version cache with latest check results
   */
  async updateVersionCache(latestVersion, updateAvailable) {
    try {
      // Ensure cache directory exists
      const cacheDir = path.dirname(this.cacheFile);
      await fs.mkdir(cacheDir, { recursive: true });

      const cacheData = {
        timestamp: Date.now(),
        currentVersion: this.currentVersion,
        latestVersion: latestVersion,
        updateAvailable: updateAvailable
      };

      await fs.writeFile(this.cacheFile, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      // Fail silently - caching is not critical functionality
    }
  }

  /**
   * Compare two semantic version strings
   * Returns true if version2 is greater than version1
   */
  compareVersions(version1, version2) {
    if (!version1 || !version2) {
      return false;
    }

    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    // Pad arrays to same length
    const maxLength = Math.max(v1Parts.length, v2Parts.length);
    while (v1Parts.length < maxLength) v1Parts.push(0);
    while (v2Parts.length < maxLength) v2Parts.push(0);

    for (let i = 0; i < maxLength; i++) {
      if (v2Parts[i] > v1Parts[i]) {
        return true;
      } else if (v2Parts[i] < v1Parts[i]) {
        return false;
      }
    }

    return false; // Versions are equal
  }

  /**
   * Clear version cache (useful for testing)
   */
  async clearCache() {
    try {
      await fs.unlink(this.cacheFile);
    } catch (error) {
      // File doesn't exist or can't be deleted - not an error
    }
  }
}

export { VersionManager };