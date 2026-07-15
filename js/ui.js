let toastStack;
let modalOverlay, modalTitle, modalBody, modalFooter, modalClose;
let focusBeforeModal = null;

export function initUI() {
  toastStack = document.getElementById('toast-stack');

  modalOverlay = document.getElementById('modal-overlay');
  modalTitle = document.getElementById('modal-title');
  modalBody = document.getElementById('modal-body');
  modalFooter = document.getElementById('modal-footer');
  modalClose = document.getElementById('modal-close');

  modalClose?.addEventListener('click', hideModal);
  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) hideModal();
  });
}

export function showToast(message, type = 'info', duration = 3200) {
  if (!toastStack) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  el.setAttribute('role', 'status');
  toastStack.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(120%)';
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  }, duration);
}

export function showModal(title, bodyHtml, buttons = []) {
  if (!modalOverlay) return;
  focusBeforeModal = document.activeElement;
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHtml;
  modalFooter.innerHTML = '';

  buttons.forEach((btn) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `btn ${btn.primary ? 'btn-primary' : 'btn-secondary'}`;
    b.textContent = btn.label;
    b.addEventListener('click', () => {
      if (btn.onClick) btn.onClick();
      if (btn.close !== false) hideModal();
    });
    modalFooter.appendChild(b);
  });

  modalOverlay.hidden = false;
  modalClose?.focus();
}

export function hideModal() {
  if (!modalOverlay) return;
  modalOverlay.hidden = true;
  if (focusBeforeModal && typeof focusBeforeModal.focus === 'function') {
    try {
      focusBeforeModal.focus();
    } catch {
      // ignore
    }
  }
  focusBeforeModal = null;
}

export function isModalOpen() {
  return modalOverlay && !modalOverlay.hidden;
}

export function confetti(duration = 1800) {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#38bdf8', '#f472b6'];
  const particles = Array.from({ length: 100 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height * 0.4 - canvas.height * 0.2,
    vx: (Math.random() - 0.5) * 8,
    vy: Math.random() * 6 + 2,
    r: Math.random() * 5 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    dRotation: (Math.random() - 0.5) * 12
  }));

  const gravity = 0.2;
  const start = performance.now();

  function frame(now) {
    const elapsed = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += gravity;
      p.rotation += p.dRotation;
      p.vx *= 0.99;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
      ctx.restore();
    });

    if (elapsed < duration) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(frame);
}
