/**
 * Theme Manager
 * Handles theme installation, removal, and management
 */

import fs from 'fs/promises';
import path from 'path';
import { FileUtils } from '../utils.js';

/**
 * ThemeManager Class
 * Manages sound themes and their lifecycle
 */
export class ThemeManager {
  /**
   * Create a new ThemeManager instance
   * @param {string} themesDir - Path to themes directory
   * @param {ConfigManager} configManager - Configuration manager instance
   */
  constructor(themesDir, configManager) {
    this.themesDir = themesDir;
    this.configManager = configManager;
  }

  /**
   * List all available themes
   * @returns {Promise<Array>} Array of theme objects with name and description
   */
  async list() {
    const themes = [];
    
    try {
      const themeNames = await fs.readdir(this.themesDir);
      
      for (const themeName of themeNames) {
        const themePath = path.join(this.themesDir, themeName);
        const stat = await fs.stat(themePath);
        
        if (stat.isDirectory()) {
          const themeInfo = await this.getThemeInfo(themePath, themeName);
          themes.push(themeInfo);
        }
      }
    } catch (error) {
      // Themes directory doesn't exist
      return [];
    }

    return themes;
  }

  /**
   * Get theme information
   * @private
   * @param {string} themePath - Path to theme directory
   * @param {string} themeName - Name of the theme
   * @returns {Promise<Object>} Theme information object
   */
  async getThemeInfo(themePath, themeName) {
    let description = 'No description';
    
    try {
      const readmePath = path.join(themePath, 'README.md');
      const readmeContent = await fs.readFile(readmePath, 'utf8');
      // Extract first line as description
      const firstLine = readmeContent.split('\n')[0].replace(/^#+\s*/, '');
      if (firstLine.trim()) {
        description = firstLine.trim();
      }
    } catch {
      // README doesn't exist or can't be read
    }
    
    // Get list of sound files
    const soundFiles = await this.getThemeSoundFiles(themePath);
    
    return {
      name: themeName,
      description,
      path: themePath,
      soundFiles,
      hasOutputStyle: await this.hasOutputStyle(themePath)
    };
  }

  /**
   * Get list of sound files in a theme
   * @private
   * @param {string} themePath - Path to theme directory
   * @returns {Promise<Array>} Array of sound file names
   */
  async getThemeSoundFiles(themePath) {
    const soundFiles = [];
    
    try {
      const files = await fs.readdir(themePath);
      for (const file of files) {
        if (file.endsWith('.wav') || file.endsWith('.mp3')) {
          soundFiles.push(file.replace(/\.(wav|mp3)$/, ''));
        }
      }
    } catch {
      // Error reading theme directory
    }
    
    return soundFiles;
  }

  /**
   * Check if theme has an output style
   * @private
   * @param {string} themePath - Path to theme directory
   * @returns {Promise<boolean>} True if theme has output style
   */
  async hasOutputStyle(themePath) {
    try {
      await fs.access(path.join(themePath, 'output-style.md'));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Install a theme from source
   * @param {string} sourcePath - Path to theme source
   * @param {string} themeName - Name for the installed theme
   */
  async install(sourcePath, themeName) {
    const destPath = path.join(this.themesDir, themeName);
    
    // Check if theme already exists
    try {
      await fs.access(destPath);
      throw new Error(`Theme "${themeName}" already exists`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    // Copy theme files
    await FileUtils.copyDirectory(sourcePath, destPath);
  }

  /**
   * Remove a theme
   * @param {string} themeName - Name of theme to remove
   */
  async remove(themeName) {
    if (themeName === 'system') {
      throw new Error('Cannot remove built-in themes');
    }

    const themePath = path.join(this.themesDir, themeName);
    
    try {
      await fs.access(themePath);
      await fs.rm(themePath, { recursive: true, force: true });
      
      // If current theme was removed, switch to fallback
      const currentTheme = this.configManager.getTheme();
      if (currentTheme === themeName) {
        await this.configManager.setTheme('zelda');
      }
    } catch (error) {
      throw new Error(`Failed to remove theme: ${error.message}`);
    }
  }

  /**
   * Set active theme
   * @param {string} themeName - Name of theme to activate
   */
  async setActive(themeName) {
    const themes = await this.list();
    const themeExists = themes.some(t => t.name === themeName);
    
    if (!themeExists) {
      throw new Error(`Theme "${themeName}" not found`);
    }
    
    await this.configManager.setTheme(themeName);
  }

  /**
   * Get active theme
   * @returns {string} Name of active theme
   */
  getActive() {
    return this.configManager.getTheme();
  }

  /**
   * Check if a theme exists
   * @param {string} themeName - Name of theme to check
   * @returns {Promise<boolean>} True if theme exists
   */
  async exists(themeName) {
    try {
      const themePath = path.join(this.themesDir, themeName);
      await fs.access(themePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get theme path
   * @param {string} themeName - Name of theme
   * @returns {string} Path to theme directory
   */
  getThemePath(themeName) {
    return path.join(this.themesDir, themeName);
  }

  /**
   * Get sound file path for a theme
   * @param {string} themeName - Name of theme
   * @param {string} soundName - Name of sound (without extension)
   * @returns {Promise<string|null>} Path to sound file or null if not found
   */
  async getSoundPath(themeName, soundName) {
    const themePath = this.getThemePath(themeName);
    
    // Try different extensions
    const extensions = ['.wav', '.mp3'];
    for (const ext of extensions) {
      const soundPath = path.join(themePath, soundName + ext);
      try {
        await fs.access(soundPath);
        return soundPath;
      } catch {
        // File doesn't exist with this extension
      }
    }
    
    return null;
  }

  /**
   * Get output style path for a theme
   * @param {string} themeName - Name of theme
   * @returns {Promise<string|null>} Path to output style or null if not found
   */
  async getOutputStylePath(themeName) {
    const stylePath = path.join(this.getThemePath(themeName), 'output-style.md');
    try {
      await fs.access(stylePath);
      return stylePath;
    } catch {
      return null;
    }
  }

  /**
   * Validate theme structure
   * @param {string} themePath - Path to theme directory
   * @returns {Promise<Object>} Validation result
   */
  async validateTheme(themePath) {
    const result = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    try {
      const stat = await fs.stat(themePath);
      if (!stat.isDirectory()) {
        result.valid = false;
        result.errors.push('Theme path is not a directory');
        return result;
      }
      
      // Check for at least one sound file
      const files = await fs.readdir(themePath);
      const soundFiles = files.filter(f => f.endsWith('.wav') || f.endsWith('.mp3'));
      
      if (soundFiles.length === 0) {
        result.warnings.push('No sound files found in theme');
      }
      
      // Check for README
      const hasReadme = files.includes('README.md');
      if (!hasReadme) {
        result.warnings.push('No README.md file found');
      }
      
    } catch (error) {
      result.valid = false;
      result.errors.push(`Error accessing theme: ${error.message}`);
    }
    
    return result;
  }

  /**
   * Copy theme to a new name
   * @param {string} sourceName - Source theme name
   * @param {string} destName - Destination theme name
   */
  async copyTheme(sourceName, destName) {
    const sourcePath = this.getThemePath(sourceName);
    const destPath = this.getThemePath(destName);
    
    // Check if source exists
    if (!await this.exists(sourceName)) {
      throw new Error(`Source theme "${sourceName}" not found`);
    }
    
    // Check if destination already exists
    if (await this.exists(destName)) {
      throw new Error(`Theme "${destName}" already exists`);
    }
    
    await FileUtils.copyDirectory(sourcePath, destPath);
  }

  /**
   * Get removable themes (non-system themes)
   * @returns {Promise<Array>} Array of removable theme names
   */
  async getRemovableThemes() {
    const themes = await this.list();
    return themes.filter(t => t.name !== 'system').map(t => t.name);
  }
}