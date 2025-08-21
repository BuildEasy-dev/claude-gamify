/**
 * Hook Manager
 * Manages Claude Code hook integration
 */

import fs from 'fs/promises';
import { FileUtils, ConfigDefaults } from '../utils.js';

/**
 * HookManager Class
 * Handles Claude Code hooks setup and removal
 */
export class HookManager {
  /**
   * Create a new HookManager instance
   * @param {string} claudeConfigPath - Path to Claude Code settings.json
   * @param {string} indexPath - Path to the hook index.js file
   */
  constructor(claudeConfigPath, indexPath) {
    this.claudeConfigPath = claudeConfigPath;
    this.indexPath = indexPath;
    this.hookNames = ConfigDefaults.hookCommands;
  }

  /**
   * Set up Claude Code hooks
   */
  async setup() {
    // Read existing Claude Code configuration
    const claudeConfig = await FileUtils.readJsonFile(this.claudeConfigPath, {});

    // Update hooks configuration with correct Claude Code format
    claudeConfig.hooks = claudeConfig.hooks || {};
    
    for (const hookName of this.hookNames) {
      claudeConfig.hooks[hookName] = [
        {
          matcher: ".*",
          hooks: [
            {
              type: "command",
              command: `node "${this.indexPath}" ${hookName}`
            }
          ]
        }
      ];
    }

    // Write back configuration file
    await FileUtils.writeJsonFile(this.claudeConfigPath, claudeConfig);
  }

  /**
   * Remove Claude Code hooks
   * @returns {number} Number of hooks removed
   */
  async remove() {
    let removedCount = 0;
    
    try {
      const claudeConfig = await FileUtils.readJsonFile(this.claudeConfigPath, {});
      
      if (claudeConfig.hooks) {
        for (const hookName of this.hookNames) {
          if (claudeConfig.hooks[hookName]) {
            const originalLength = claudeConfig.hooks[hookName].length;
            
            claudeConfig.hooks[hookName] = claudeConfig.hooks[hookName].filter(hookEntry => {
              if (!hookEntry.hooks) return true;
              
              const originalHooksLength = hookEntry.hooks.length;
              hookEntry.hooks = hookEntry.hooks.filter(hook => 
                !hook.command || !hook.command.includes(this.indexPath)
              );
              
              if (hookEntry.hooks.length < originalHooksLength) {
                removedCount++;
              }
              
              return hookEntry.hooks.length > 0;
            });
            
            if (claudeConfig.hooks[hookName].length === 0) {
              delete claudeConfig.hooks[hookName];
            }
          }
        }
        
        if (Object.keys(claudeConfig.hooks).length === 0) {
          delete claudeConfig.hooks;
        }
      }
      
      await FileUtils.writeJsonFile(this.claudeConfigPath, claudeConfig);
    } catch (error) {
      // Claude settings file doesn't exist or is invalid
      throw new Error(`Failed to remove hooks: ${error.message}`);
    }
    
    return removedCount;
  }

  /**
   * Update a specific hook
   * @param {string} hookName - Name of the hook to update
   * @param {string} command - New command for the hook
   */
  async updateHook(hookName, command) {
    if (!this.hookNames.includes(hookName)) {
      throw new Error(`Invalid hook name: ${hookName}`);
    }
    
    const claudeConfig = await FileUtils.readJsonFile(this.claudeConfigPath, {});
    claudeConfig.hooks = claudeConfig.hooks || {};
    
    claudeConfig.hooks[hookName] = [
      {
        matcher: ".*",
        hooks: [
          {
            type: "command",
            command: command
          }
        ]
      }
    ];
    
    await FileUtils.writeJsonFile(this.claudeConfigPath, claudeConfig);
  }

  /**
   * Check if hooks are installed
   * @returns {Promise<boolean>} True if hooks are installed
   */
  async areHooksInstalled() {
    try {
      const claudeConfig = await FileUtils.readJsonFile(this.claudeConfigPath, {});
      
      if (!claudeConfig.hooks) {
        return false;
      }
      
      // Check if all expected hooks are present
      for (const hookName of this.hookNames) {
        if (!claudeConfig.hooks[hookName]) {
          return false;
        }
        
        // Check if hook contains our command
        const hasOurCommand = claudeConfig.hooks[hookName].some(entry => 
          entry.hooks && entry.hooks.some(hook => 
            hook.command && hook.command.includes(this.indexPath)
          )
        );
        
        if (!hasOurCommand) {
          return false;
        }
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get installed hooks
   * @returns {Promise<Array>} Array of installed hook names
   */
  async getInstalledHooks() {
    const installedHooks = [];
    
    try {
      const claudeConfig = await FileUtils.readJsonFile(this.claudeConfigPath, {});
      
      if (claudeConfig.hooks) {
        for (const hookName of this.hookNames) {
          if (claudeConfig.hooks[hookName]) {
            const hasOurCommand = claudeConfig.hooks[hookName].some(entry => 
              entry.hooks && entry.hooks.some(hook => 
                hook.command && hook.command.includes(this.indexPath)
              )
            );
            
            if (hasOurCommand) {
              installedHooks.push(hookName);
            }
          }
        }
      }
    } catch {
      // Error reading config
    }
    
    return installedHooks;
  }

  /**
   * Disable a specific hook
   * @param {string} hookName - Name of the hook to disable
   */
  async disableHook(hookName) {
    if (!this.hookNames.includes(hookName)) {
      throw new Error(`Invalid hook name: ${hookName}`);
    }
    
    const claudeConfig = await FileUtils.readJsonFile(this.claudeConfigPath, {});
    
    if (claudeConfig.hooks && claudeConfig.hooks[hookName]) {
      delete claudeConfig.hooks[hookName];
      
      if (Object.keys(claudeConfig.hooks).length === 0) {
        delete claudeConfig.hooks;
      }
      
      await FileUtils.writeJsonFile(this.claudeConfigPath, claudeConfig);
    }
  }

  /**
   * Enable a specific hook
   * @param {string} hookName - Name of the hook to enable
   */
  async enableHook(hookName) {
    if (!this.hookNames.includes(hookName)) {
      throw new Error(`Invalid hook name: ${hookName}`);
    }
    
    const claudeConfig = await FileUtils.readJsonFile(this.claudeConfigPath, {});
    claudeConfig.hooks = claudeConfig.hooks || {};
    
    claudeConfig.hooks[hookName] = [
      {
        matcher: ".*",
        hooks: [
          {
            type: "command",
            command: `node "${this.indexPath}" ${hookName}`
          }
        ]
      }
    ];
    
    await FileUtils.writeJsonFile(this.claudeConfigPath, claudeConfig);
  }

  /**
   * Get hook configuration
   * @param {string} hookName - Name of the hook
   * @returns {Promise<Object|null>} Hook configuration or null
   */
  async getHookConfig(hookName) {
    try {
      const claudeConfig = await FileUtils.readJsonFile(this.claudeConfigPath, {});
      
      if (claudeConfig.hooks && claudeConfig.hooks[hookName]) {
        return claudeConfig.hooks[hookName];
      }
    } catch {
      // Error reading config
    }
    
    return null;
  }

  /**
   * Backup current hooks configuration
   * @returns {Promise<Object>} Backup of hooks configuration
   */
  async backupHooks() {
    try {
      const claudeConfig = await FileUtils.readJsonFile(this.claudeConfigPath, {});
      return claudeConfig.hooks || {};
    } catch {
      return {};
    }
  }

  /**
   * Restore hooks configuration from backup
   * @param {Object} backup - Hooks configuration backup
   */
  async restoreHooks(backup) {
    const claudeConfig = await FileUtils.readJsonFile(this.claudeConfigPath, {});
    claudeConfig.hooks = backup;
    await FileUtils.writeJsonFile(this.claudeConfigPath, claudeConfig);
  }
}