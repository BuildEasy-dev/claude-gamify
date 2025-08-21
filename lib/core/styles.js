/**
 * Style Manager
 * Manages Claude Code output styles
 */

import fs from 'fs/promises';
import path from 'path';
import { FileUtils } from '../utils.js';

/**
 * StyleManager Class
 * Handles output style installation, management, and removal
 */
export class StyleManager {
  /**
   * Create a new StyleManager instance
   * @param {string} claudeConfigPath - Path to Claude Code settings.json
   * @param {string} outputStylesDir - Path to Claude output styles directory
   */
  constructor(claudeConfigPath, outputStylesDir) {
    this.claudeConfigPath = claudeConfigPath;
    this.outputStylesDir = outputStylesDir;
  }

  /**
   * Set up output styles from themes
   * @param {string} templateThemesDir - Path to template themes directory
   */
  async setupFromThemes(templateThemesDir) {
    try {
      // Get list of theme directories
      const themeNames = await fs.readdir(templateThemesDir, { withFileTypes: true });
      
      for (const themeEntry of themeNames) {
        if (themeEntry.isDirectory()) {
          const themeName = themeEntry.name;
          await this.installThemeStyle(templateThemesDir, themeName);
        }
      }
      
      // Set the initial theme's output style in Claude settings
      await this.setActiveStyle('zelda');
    } catch (error) {
      throw new Error(`Failed to set up output styles: ${error.message}`);
    }
  }

  /**
   * Install output style for a theme
   * @param {string} themesBaseDir - Base directory containing themes
   * @param {string} themeName - Name of the theme
   */
  async installThemeStyle(themesBaseDir, themeName) {
    const themeOutputStylePath = path.join(themesBaseDir, themeName, 'output-style.md');
    
    // Check if this theme has an output style file
    try {
      await fs.access(themeOutputStylePath);
      
      // Copy to ~/.claude/output-styles with theme name prefix
      const targetPath = path.join(this.outputStylesDir, `${themeName}.md`);
      await fs.copyFile(themeOutputStylePath, targetPath);
      
    } catch (error) {
      // Output style file doesn't exist for this theme, skip
    }
  }

  /**
   * Update Claude's outputStyle setting for a theme
   * @param {string} themeName - Name of the theme to set as active
   */
  async setActiveStyle(themeName) {
    try {
      // Read existing Claude settings
      const claudeConfig = await FileUtils.readJsonFile(this.claudeConfigPath, {});
      
      if (themeName === 'system') {
        // Remove outputStyle to restore default behavior
        delete claudeConfig.outputStyle;
      } else {
        // Check if the theme has an output style
        const outputStylePath = path.join(this.outputStylesDir, `${themeName}.md`);
        try {
          await fs.access(outputStylePath);
          // Update outputStyle setting
          claudeConfig.outputStyle = themeName;
        } catch {
          // No output style for this theme, remove the setting
          delete claudeConfig.outputStyle;
        }
      }
      
      // Write back configuration
      await FileUtils.writeJsonFile(this.claudeConfigPath, claudeConfig);
    } catch (error) {
      // Silently fail - output style is optional
      console.warn(`Could not update output style: ${error.message}`);
    }
  }

  /**
   * Get current active output style
   * @returns {Promise<string|null>} Active output style name or null
   */
  async getActiveStyle() {
    try {
      const claudeConfig = await FileUtils.readJsonFile(this.claudeConfigPath, {});
      return claudeConfig.outputStyle || null;
    } catch {
      return null;
    }
  }

  /**
   * Check if a style exists
   * @param {string} styleName - Name of the style to check
   * @returns {Promise<boolean>} True if style exists
   */
  async styleExists(styleName) {
    try {
      const stylePath = path.join(this.outputStylesDir, `${styleName}.md`);
      await fs.access(stylePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove an output style
   * @param {string} styleName - Name of the style to remove
   */
  async removeStyle(styleName) {
    const stylePath = path.join(this.outputStylesDir, `${styleName}.md`);
    
    try {
      await fs.unlink(stylePath);
    } catch (error) {
      // File doesn't exist or can't be deleted
    }
  }

  /**
   * List all available output styles
   * @returns {Promise<Array>} Array of style names
   */
  async listStyles() {
    const styles = [];
    
    try {
      const files = await fs.readdir(this.outputStylesDir);
      for (const file of files) {
        if (file.endsWith('.md')) {
          styles.push(file.replace('.md', ''));
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }
    
    return styles;
  }

  /**
   * Clean gamify-related output styles
   * @param {Array} gamifyThemes - Array of gamify theme names
   * @returns {Promise<Array>} Array of removed style names
   */
  async cleanGamifyStyles(gamifyThemes) {
    const removedStyles = [];
    
    for (const themeName of gamifyThemes) {
      const stylePath = path.join(this.outputStylesDir, `${themeName}.md`);
      try {
        await fs.access(stylePath);
        await fs.unlink(stylePath);
        removedStyles.push(`${themeName}.md`);
      } catch {
        // Style file doesn't exist, skip
      }
    }
    
    return removedStyles;
  }

  /**
   * Reset Claude's output style if using a gamify theme
   * @param {Array} gamifyThemes - Array of gamify theme names
   */
  async resetIfGamifyTheme(gamifyThemes) {
    try {
      const claudeConfig = await FileUtils.readJsonFile(this.claudeConfigPath, {});
      
      // Check if current output style is a gamify theme
      if (claudeConfig.outputStyle && gamifyThemes.includes(claudeConfig.outputStyle)) {
        delete claudeConfig.outputStyle;
        await FileUtils.writeJsonFile(this.claudeConfigPath, claudeConfig);
      }
    } catch (error) {
      // Claude settings file doesn't exist or is invalid
    }
  }

  /**
   * Get output style content
   * @param {string} styleName - Name of the style
   * @returns {Promise<string|null>} Style content or null if not found
   */
  async getStyleContent(styleName) {
    try {
      const stylePath = path.join(this.outputStylesDir, `${styleName}.md`);
      return await fs.readFile(stylePath, 'utf8');
    } catch {
      return null;
    }
  }

  /**
   * Create or update an output style
   * @param {string} styleName - Name of the style
   * @param {string} content - Style content (markdown)
   */
  async createStyle(styleName, content) {
    const stylePath = path.join(this.outputStylesDir, `${styleName}.md`);
    
    // Ensure output styles directory exists
    await fs.mkdir(this.outputStylesDir, { recursive: true });
    
    await fs.writeFile(stylePath, content, 'utf8');
  }

  /**
   * Copy a style to a new name
   * @param {string} sourceName - Source style name
   * @param {string} destName - Destination style name
   */
  async copyStyle(sourceName, destName) {
    const sourcePath = path.join(this.outputStylesDir, `${sourceName}.md`);
    const destPath = path.join(this.outputStylesDir, `${destName}.md`);
    
    // Check if source exists
    try {
      await fs.access(sourcePath);
    } catch {
      throw new Error(`Source style "${sourceName}" not found`);
    }
    
    // Check if destination already exists
    try {
      await fs.access(destPath);
      throw new Error(`Style "${destName}" already exists`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        throw error;
      }
      // File doesn't exist, which is what we want
    }
    
    await fs.copyFile(sourcePath, destPath);
  }

  /**
   * Backup all output styles
   * @returns {Promise<Object>} Backup object with style names and content
   */
  async backupStyles() {
    const backup = {};
    const styles = await this.listStyles();
    
    for (const styleName of styles) {
      const content = await this.getStyleContent(styleName);
      if (content) {
        backup[styleName] = content;
      }
    }
    
    return backup;
  }

  /**
   * Restore output styles from backup
   * @param {Object} backup - Backup object with style names and content
   */
  async restoreStyles(backup) {
    for (const [styleName, content] of Object.entries(backup)) {
      await this.createStyle(styleName, content);
    }
  }

  /**
   * Get style statistics
   * @returns {Promise<Object>} Style statistics
   */
  async getStyleStats() {
    const styles = await this.listStyles();
    const activeStyle = await this.getActiveStyle();
    
    const stats = {
      totalStyles: styles.length,
      activeStyle: activeStyle,
      availableStyles: styles,
      hasActiveStyle: activeStyle !== null
    };
    
    return stats;
  }
}