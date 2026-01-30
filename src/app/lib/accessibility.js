// Accessibility utilities and helpers

// ARIA labels and descriptions
export const ARIA_LABELS = {
  // Navigation
  MAIN_NAVIGATION: 'Main navigation',
  USER_MENU: 'User menu',
  BREADCRUMB: 'Breadcrumb navigation',
  
  // Content
  MAIN_CONTENT: 'Main content',
  SIDEBAR: 'Sidebar',
  FOOTER: 'Footer',
  
  // Forms
  SEARCH_FORM: 'Search form',
  LOGIN_FORM: 'Login form',
  REGISTRATION_FORM: 'Registration form',
  POST_FORM: 'Create post form',
  COMMENT_FORM: 'Comment form',
  
  // Interactive elements
  LIKE_BUTTON: 'Like this post',
  SHARE_BUTTON: 'Share this post',
  COMMENT_BUTTON: 'Comment on this post',
  EDIT_BUTTON: 'Edit this post',
  DELETE_BUTTON: 'Delete this post',
  FOLLOW_BUTTON: 'Follow this user',
  UNFOLLOW_BUTTON: 'Unfollow this user',
  
  // Modals and overlays
  MODAL: 'Modal dialog',
  CLOSE_MODAL: 'Close modal',
  CONFIRM_DIALOG: 'Confirmation dialog',
  
  // Status messages
  LOADING: 'Loading content',
  ERROR_MESSAGE: 'Error message',
  SUCCESS_MESSAGE: 'Success message',
  WARNING_MESSAGE: 'Warning message',
  
  // Data tables
  DATA_TABLE: 'Data table',
  SORTABLE_COLUMN: 'Sortable column',
  FILTER_OPTIONS: 'Filter options',
  
  // Pagination
  PAGINATION: 'Pagination',
  PREVIOUS_PAGE: 'Go to previous page',
  NEXT_PAGE: 'Go to next page',
  PAGE_NUMBER: 'Go to page',
  
  // Search and filters
  SEARCH_INPUT: 'Search input',
  FILTER_BUTTON: 'Filter options',
  CLEAR_FILTERS: 'Clear all filters',
  
  // Events and calendar
  EVENT_CALENDAR: 'Event calendar',
  EVENT_DETAILS: 'Event details',
  RSVP_BUTTON: 'RSVP to this event',
  CANCEL_RSVP: 'Cancel RSVP',
  
  // Gamification
  LEADERBOARD: 'Leaderboard',
  BADGE: 'Badge',
  POINTS: 'Points',
  LEVEL: 'Level',
  
  // Notifications
  NOTIFICATION: 'Notification',
  MARK_AS_READ: 'Mark as read',
  MARK_ALL_READ: 'Mark all as read',
  
  // File uploads
  FILE_UPLOAD: 'File upload',
  DRAG_DROP_AREA: 'Drag and drop area',
  UPLOAD_PROGRESS: 'Upload progress',
  
  // Tabs and accordions
  TAB_LIST: 'Tab list',
  TAB_PANEL: 'Tab panel',
  ACCORDION_HEADER: 'Accordion header',
  ACCORDION_PANEL: 'Accordion panel'
};

// Keyboard navigation helpers
export const KEYBOARD_NAVIGATION = {
  // Arrow keys for navigation
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  
  // Tab navigation
  TAB: 'Tab',
  SHIFT_TAB: 'Shift+Tab',
  
  // Enter and space
  ENTER: 'Enter',
  SPACE: ' ',
  
  // Escape
  ESCAPE: 'Escape',
  
  // Home and end
  HOME: 'Home',
  END: 'End',
  
  // Page up and down
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown'
};

// Focus management
export class FocusManager {
  constructor() {
    this.focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    this.previousFocus = null;
  }

  // Get all focusable elements within a container
  getFocusableElements(container = document) {
    return Array.from(container.querySelectorAll(this.focusableElements));
  }

  // Trap focus within a container (for modals)
  trapFocus(container) {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  // Restore focus to previous element
  restoreFocus() {
    if (this.previousFocus) {
      this.previousFocus.focus();
      this.previousFocus = null;
    }
  }

  // Save current focus
  saveFocus() {
    this.previousFocus = document.activeElement;
  }

  // Move focus to next element
  moveFocusNext() {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement);
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    focusableElements[nextIndex]?.focus();
  }

  // Move focus to previous element
  moveFocusPrevious() {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement);
    const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
    focusableElements[prevIndex]?.focus();
  }
}

// Screen reader announcements
export class ScreenReaderAnnouncer {
  constructor() {
    this.announcementContainer = this.createAnnouncementContainer();
  }

  createAnnouncementContainer() {
    let container = document.getElementById('sr-announcements');
    if (!container) {
      container = document.createElement('div');
      container.id = 'sr-announcements';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      container.style.position = 'absolute';
      container.style.left = '-10000px';
      container.style.width = '1px';
      container.style.height = '1px';
      container.style.overflow = 'hidden';
      document.body.appendChild(container);
    }
    return container;
  }

  announce(message, priority = 'polite') {
    this.announcementContainer.setAttribute('aria-live', priority);
    this.announcementContainer.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      this.announcementContainer.textContent = '';
    }, 1000);
  }

  announceError(message) {
    this.announce(message, 'assertive');
  }

  announceSuccess(message) {
    this.announce(message, 'polite');
  }
}

// Color contrast utilities
export class ColorContrast {
  // Calculate relative luminance
  static getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // Calculate contrast ratio
  static getContrastRatio(color1, color2) {
    const lum1 = this.getLuminance(...color1);
    const lum2 = this.getLuminance(...color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  // Check if contrast meets WCAG standards
  static meetsWCAG(color1, color2, level = 'AA') {
    const ratio = this.getContrastRatio(color1, color2);
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
  }

  // Convert hex to RGB
  static hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  }
}

// Skip links
export const createSkipLink = (href, text) => {
  const skipLink = document.createElement('a');
  skipLink.href = href;
  skipLink.textContent = text;
  skipLink.className = 'skip-link';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 6px;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    z-index: 1000;
    border-radius: 4px;
  `;
  
  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '6px';
  });
  
  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });
  
  return skipLink;
};

// Form validation helpers
export class FormValidator {
  constructor(form) {
    this.form = form;
    this.errors = new Map();
  }

  // Validate required fields
  validateRequired(fields) {
    fields.forEach(field => {
      const element = this.form.querySelector(`[name="${field}"]`);
      if (element && !element.value.trim()) {
        this.addError(field, `${this.getFieldLabel(field)} is required`);
      } else {
        this.removeError(field);
      }
    });
  }

  // Validate email format
  validateEmail(field) {
    const element = this.form.querySelector(`[name="${field}"]`);
    if (element && element.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(element.value)) {
        this.addError(field, 'Please enter a valid email address');
      } else {
        this.removeError(field);
      }
    }
  }

  // Validate password strength
  validatePassword(field) {
    const element = this.form.querySelector(`[name="${field}"]`);
    if (element && element.value) {
      const password = element.value;
      const errors = [];
      
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
      }
      
      if (errors.length > 0) {
        this.addError(field, errors.join('. '));
      } else {
        this.removeError(field);
      }
    }
  }

  // Add error to field
  addError(field, message) {
    this.errors.set(field, message);
    this.updateFieldError(field, message);
  }

  // Remove error from field
  removeError(field) {
    this.errors.delete(field);
    this.clearFieldError(field);
  }

  // Update field error display
  updateFieldError(field, message) {
    const element = this.form.querySelector(`[name="${field}"]`);
    if (element) {
      element.setAttribute('aria-invalid', 'true');
      element.setAttribute('aria-describedby', `${field}-error`);
      
      let errorElement = this.form.querySelector(`#${field}-error`);
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = `${field}-error`;
        errorElement.className = 'error-message';
        errorElement.setAttribute('role', 'alert');
        element.parentNode.insertBefore(errorElement, element.nextSibling);
      }
      errorElement.textContent = message;
    }
  }

  // Clear field error display
  clearFieldError(field) {
    const element = this.form.querySelector(`[name="${field}"]`);
    if (element) {
      element.removeAttribute('aria-invalid');
      element.removeAttribute('aria-describedby');
      
      const errorElement = this.form.querySelector(`#${field}-error`);
      if (errorElement) {
        errorElement.remove();
      }
    }
  }

  // Get field label
  getFieldLabel(field) {
    const element = this.form.querySelector(`[name="${field}"]`);
    if (element) {
      const label = this.form.querySelector(`label[for="${element.id}"]`);
      if (label) {
        return label.textContent;
      }
    }
    return field;
  }

  // Check if form is valid
  isValid() {
    return this.errors.size === 0;
  }

  // Get all errors
  getErrors() {
    return Object.fromEntries(this.errors);
  }
}

// High contrast mode detection
export const isHighContrastMode = () => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

// Reduced motion detection
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Dark mode detection
export const prefersDarkMode = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Initialize accessibility features
export const initializeAccessibility = () => {
  // Add skip links
  const skipLinks = [
    { href: '#main-content', text: 'Skip to main content' },
    { href: '#navigation', text: 'Skip to navigation' },
    { href: '#search', text: 'Skip to search' }
  ];

  skipLinks.forEach(link => {
    const skipLink = createSkipLink(link.href, link.text);
    document.body.insertBefore(skipLink, document.body.firstChild);
  });

  // Add focus indicators for keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  });

  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
  });

  // Add CSS for focus indicators
  const style = document.createElement('style');
  style.textContent = `
    .keyboard-navigation *:focus {
      outline: 2px solid #6b4423 !important;
      outline-offset: 2px !important;
    }
    
    .skip-link:focus {
      top: 6px !important;
    }
    
    .error-message {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
    
    [aria-invalid="true"] {
      border-color: #dc3545 !important;
    }
  `;
  document.head.appendChild(style);
};

// Export all utilities
export default {
  ARIA_LABELS,
  KEYBOARD_NAVIGATION,
  FocusManager,
  ScreenReaderAnnouncer,
  ColorContrast,
  createSkipLink,
  FormValidator,
  isHighContrastMode,
  prefersReducedMotion,
  prefersDarkMode,
  initializeAccessibility
};
