/**
 * UI Components Export Portal
 * Centralized exports for all UI components - maintains backward compatibility
 */

// Welcome components
export { WelcomeScreen } from './welcome-screen.js';

// Status components
export { StatusBar } from './status-bar.js';
export { SystemInfoDisplay } from './status-system-info-display.js';

// Sound components
export { SoundConfigState } from './sound-config-state.js';
export { SoundConfigDisplay } from './sound-config-display.js';
export { TestSoundsDisplay } from './sound-test-display.js';
export { InteractiveTestSoundsDisplay } from './sound-interactive-test-display.js';

// Theme components
export { ThemeManagementDisplay, ThemeListDisplay } from './theme-management-display.js';

// Version components
export { VersionCheckDisplay } from './version-check-display.js';

// Uninstall components
export { UninstallWarning } from './uninstall-warning.js';

// Common components
export { LoadingSpinner } from './common-loading-spinner.js';
export { MessageBox } from './common-message-box.js';