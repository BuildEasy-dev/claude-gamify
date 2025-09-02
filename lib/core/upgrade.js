/**
 * Upgrade Manager
 * Implements silent, incremental upgrade at CLI startup
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { Paths, FileUtils, SystemUtils } from '../utils.js';

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function hashFile(p) {
  try {
    const data = await fs.readFile(p);
    return crypto.createHash('sha1').update(data).digest('hex');
  } catch {
    return null;
  }
}

async function copyIfChanged(src, dest, mode) {
  const srcHash = await hashFile(src);
  const destHash = await hashFile(dest);
  if (!destHash || srcHash !== destHash) {
    // Ensure parent directory exists
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
    if (mode) {
      try { await fs.chmod(dest, mode); } catch { /* ignore */ }
    }
    return true;
  }
  return false;
}

function mergeConfigurations(localConfig, templateConfig) {
  const mergedConfig = { ...templateConfig };
  Object.keys(localConfig || {}).forEach((key) => {
    if (key in templateConfig) {
      mergedConfig[key] = localConfig[key];
    }
  });
  return mergedConfig;
}

export class UpgradeManager {
  /**
   * Perform silent upgrade if needed based on version/config/files
   * @returns {string|null} New version if upgraded, null if no upgrade needed or failed
   */
  static async silentUpgradeOnStartup(configManager, themeManager, styleManager) {
    // Determine current package/template version
    const pkgVersion = SystemUtils.getSystemInfo().version;

    // If config not loaded, do nothing here (caller ensures load)
    let localConfig;
    try {
      localConfig = configManager.getConfig();
    } catch {
      return null; // not initialized yet
    }

    const needsVersionUpgrade = !localConfig.version || localConfig.version !== pkgVersion;

    // Check for critical files
    const needsPlayer = !(await fileExists(Paths.playerPath));
    const needsIndex = !(await fileExists(Paths.indexPath));

    // If nothing to do, return early
    if (!needsVersionUpgrade && !needsPlayer && !needsIndex) {
      return null;
    }

    // 1) Merge and update config with template defaults
    try {
      const templateConfig = await FileUtils.readJsonFile(path.join(Paths.templateDir, 'config.json'), {});
      let merged = mergeConfigurations(localConfig, templateConfig);
      // Always stamp to current version
      merged.version = pkgVersion;
      await configManager.import(merged);
    } catch {
      // ignore config import errors to keep silent
    }

    // 2) Incremental sync of theme files and output styles
    try {
      const templateThemesDir = path.join(Paths.templateDir, 'themes');
      const entries = await fs.readdir(templateThemesDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const themeName = entry.name;
        const srcThemeDir = path.join(templateThemesDir, themeName);
        const destThemeDir = path.join(Paths.themesDir, themeName);
        await fs.mkdir(destThemeDir, { recursive: true });

        const themeFiles = await fs.readdir(srcThemeDir, { withFileTypes: true });
        for (const f of themeFiles) {
          const src = path.join(srcThemeDir, f.name);
          if (f.isDirectory()) continue; // no nested dirs expected
          // Audio files -> ~/.claude-gamify/themes/<theme>/*.wav|*.mp3
          if (f.name.endsWith('.wav') || f.name.endsWith('.mp3')) {
            const dest = path.join(destThemeDir, f.name);
            await copyIfChanged(src, dest);
          }
          // output-style.md -> ~/.claude/output-styles/<theme>.md
          if (f.name === 'output-style.md') {
            const dest = path.join(Paths.claudeOutputStylesDir, `${themeName}.md`);
            await copyIfChanged(src, dest);
          }
        }
      }
      // Ensure Claude's active output style reflects current theme
      try {
        const theme = configManager.getTheme();
        await styleManager.setActiveStyle(theme);
      } catch { /* ignore */ }
    } catch { /* ignore */ }

    // 3) Ensure core player and index are present and updated if changed
    try {
      await copyIfChanged(path.join(Paths.templateDir, 'play_sound.js'), Paths.playerPath, 0o755);
    } catch { /* ignore */ }
    try {
      await copyIfChanged(path.join(Paths.templateDir, 'index.js'), Paths.indexPath);
    } catch { /* ignore */ }
    
    // Return the version we upgraded to
    return pkgVersion;
  }
}

