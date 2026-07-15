import { isModalOpen, hideModal } from './ui.js';

export function initAccessibility() {
  document.addEventListener('keydown', handleGlobalKey);
  handleFocusVisible();
}

function handleGlobalKey(e) {
  if (e.key === 'Escape' && isModalOpen()) {
    e.preventDefault();
    hideModal();
    return;
  }

  if (isModalOpen()) {
    trapFocus(e);
  }

  // Горячие клавиши игры
  if (e.ctrlKey && e.key === 'Enter') {
    const check = document.getElementById('btn-check');
    if (check && !check.disabled) {
      e.preventDefault();
      check.click();
    }
  }

  if (e.ctrlKey && (e.key === 'h' || e.key === 'H' || e.key === 'р' || e.key === 'Р')) {
    const hint = document.getElementById('btn-hint');
    if (hint && !hint.disabled) {
      e.preventDefault();
      hint.click();
    }
  }
}

function trapFocus(e) {
  const modal = document.querySelector('.modal-overlay:not([hidden]) .modal-card');
  if (!modal) return;

  const focusable = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.key !== 'Tab') return;

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function handleFocusVisible() {
  document.body.addEventListener('mousedown', () => document.body.classList.add('using-mouse'));
  document.body.addEventListener('keydown', () => document.body.classList.remove('using-mouse'));
}
