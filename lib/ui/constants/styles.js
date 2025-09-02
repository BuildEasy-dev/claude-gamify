/**
 * UI Styles and Visual Configuration
 * Contains all styling-related constants for visual elements
 */

import chalk from 'chalk';

// Color Scheme
export const COLORS = {
  BORDER: '#cc785c',
  ACCENT: '#cc785c',
  SUCCESS: 'green',
  WARNING: 'yellow',
  ERROR: 'red',
  INFO: 'cyan',
  MUTED: 'gray'
};

// Box Configurations
export const BOX_STYLES = {
  // Standard box for general UI elements
  BASE: {
    borderStyle: 'single',
    borderColor: COLORS.BORDER,
    padding: 1,
    margin: 1
  },
  
  // Warning box for destructive actions
  WARNING: {
    borderStyle: 'single',
    borderColor: 'red',
    padding: 1,
    margin: 0
  },
  
  // Compact box for inline messages
  COMPACT: {
    borderStyle: 'single',
    borderColor: COLORS.BORDER,
    padding: 1,
    margin: 0
  },
  
  // Welcome screen box
  WELCOME: {
    borderStyle: 'single',
    borderColor: COLORS.BORDER,
    padding: 1,
    margin: 0,
    textAlignment: 'center'
  }
};

// ASCII Art Configuration
export const ASCII_CONFIG = {
  FONT: 'Small',
  HORIZONTAL_LAYOUT: 'default',
  VERTICAL_LAYOUT: 'default',
  WIDTH: 60,
  WHITESPACE_BREAK: true
};

// Status Bar Configuration
export const STATUS_BAR = {
  WIDTH: 65,
  BORDER_CHAR: '─',
  CORNER_TOP_LEFT: '┌',
  CORNER_TOP_RIGHT: '┐',
  CORNER_BOTTOM_LEFT: '└',
  CORNER_BOTTOM_RIGHT: '┘',
  VERTICAL_CHAR: '│'
};

// Standard Layout Components (following Settings design patterns)
export const LAYOUT_PATTERNS = {
  // Title formatting
  TITLE: (text) => chalk.bold.hex(COLORS.ACCENT)(`\n  ${text}`),
  
  // Decorative separator line
  SEPARATOR_HEAVY: (length = 40) => chalk.gray('  ' + '\u2550'.repeat(length)),
  SEPARATOR_LIGHT: (length = 40) => chalk.gray('  ' + '\u2500'.repeat(length)),
  
  // Section headers
  SECTION_HEADER: (text) => chalk.bold(`\n  ${text}:`),
  
  // Item formatting with dots
  ITEM_LINE: (label, value, maxWidth = 20) => {
    const dots = '.'.repeat(Math.max(1, maxWidth - label.length));
    return `  ${label}${dots}[ ${value} ]`;
  },
  
  // State highlighting
  HIGHLIGHT_ACTIVE: (text) => chalk.bgHex('#444').white(text),
  HIGHLIGHT_DISABLED: (text) => chalk.dim(text),
  
  // Control hints at bottom
  CONTROL_BAR: (hints) => [
    chalk.gray('\n  ' + '\u2500'.repeat(40)),
    chalk.gray(`  ${hints.join(' ')}`),
    ''
  ].join('\n')
};