/**
 * UI Components Export Portal
 * Centralized exports for all UI components - maintains backward compatibility
 */

// Welcome components
export { WelcomeScreen } from './welcome/index.js';

// Status components
export { 
  StatusBar,
  SystemInfoDisplay
} from './status/index.js';

// Sound components
export { 
  SoundConfigState,
  SoundConfigDisplay,
  TestSoundsDisplay,
  InteractiveTestSoundsDisplay
} from './sound/index.js';

// Theme components
export { 
  ThemeManagementDisplay,
  ThemeListDisplay
} from './theme/index.js';

// Version components
export { VersionCheckDisplay } from './version/index.js';

// Uninstall components
export { UninstallWarning } from './uninstall/index.js';

// Common components
export { 
  LoadingSpinner,
  MessageBox
} from './common/index.js';