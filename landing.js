// Smooth scroll offset to account for sticky header
const header = document.querySelector('.site-header');

function scrollToHash(hash) {
  const target = document.querySelector(hash);
  if (!target) return;
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  const top = target.getBoundingClientRect().top + window.scrollY - (headerHeight + 12);
  window.scrollTo({ top, behavior: 'smooth' });

  // After scrolling, briefly pop the section heading
  // Try to find the first heading inside the target section
  const applyPop = () => {
    const heading = target.querySelector('h1, h2, h3, .name');
    if (!heading) return;
    heading.classList.remove('section-pop');
    // Force reflow to restart animation if already applied
    void heading.offsetWidth;
    heading.classList.add('section-pop');
    setTimeout(() => heading.classList.remove('section-pop'), 1000);
  };

  // If smooth behavior is supported, wait a bit for the scroll to complete
  // Use requestAnimationFrame loop with a short timeout as a heuristic
  let attempts = 0;
  const checkSettled = () => {
    attempts++;
    if (attempts > 20) { applyPop(); return; }
    // When we're close to the target, trigger the pop
    const currentTop = target.getBoundingClientRect().top - (headerHeight + 12);
    if (Math.abs(currentTop) < 4) { applyPop(); return; }
    requestAnimationFrame(checkSettled);
  };
  requestAnimationFrame(checkSettled);
}

document.addEventListener('click', function (e) {
  const anchor = e.target.closest('a[href^="#"]');
  if (!anchor) return;
  const href = anchor.getAttribute('href');
  if (href.length > 1) {
    e.preventDefault();
    history.pushState(null, '', href);
    scrollToHash(href);
  }
});

window.addEventListener('load', function () {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
  if (location.hash) scrollToHash(location.hash);
  setupSeamlessCarousels();
  setupResumeModal();
});


// Build seamless, infinite carousel by creating two identical halves
function setupSeamlessCarousels() {
  const viewports = document.querySelectorAll('.carousel-viewport');
  viewports.forEach((viewport) => {
    const isTop = viewport.classList.contains('top');
    const track = viewport.querySelector(isTop ? '.carousel-track.top' : '.carousel-track.bottom');
    if (!track) return;

    // Cache base items (exclude existing aria-hidden clones)
    if (!track.__baseItemsMarkup) {
      const baseItems = Array.from(track.children).filter((el) => !el.hasAttribute('aria-hidden'));
      track.__baseItemsMarkup = baseItems.map((el) => el.outerHTML).join('');
    }

    // Rebuild track content from base items
    track.innerHTML = track.__baseItemsMarkup;

    // Grow the first half until it comfortably exceeds the viewport width
    const targetHalfWidth = viewport.clientWidth * 2; // make half wide enough
    let safety = 0;
    while (track.scrollWidth < targetHalfWidth && safety < 500) {
      track.insertAdjacentHTML('beforeend', track.__baseItemsMarkup);
      safety++;
    }

    // Duplicate the entire first half to create a seamless second half
    const halfItemCount = track.children.length;
    track.insertAdjacentHTML('beforeend', track.innerHTML);

    // Hide the second half from assistive tech
    const allItems = Array.from(track.children);
    for (let i = halfItemCount; i < allItems.length; i++) {
      allItems[i].setAttribute('aria-hidden', 'true');
    }

    // Optional: keep speed roughly constant across widths
    const pxPerSecond = 40; // adjust to taste
    const durationSec = Math.max(10, (track.scrollWidth / 2) / pxPerSecond);
    track.style.animationDuration = durationSec + 's';
  });

  // Rebuild on resize (debounced)
  if (!window.__carouselResizeBound) {
    window.__carouselResizeBound = true;
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setupSeamlessCarousels, 200);
    });
  }
}

// Resume modal open/close and src management
function setupResumeModal() {
  const RESUME_URL = 'files/Betorio_Ian_CV.pdf';
  const modal = document.getElementById('resume-modal');
  const frame = document.getElementById('resume-frame');
  const closeBtn = modal?.querySelector('.resume-modal-close');
  if (!modal || !frame) return;

  function openModal() {
    frame.src = RESUME_URL;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    frame.src = '';
    document.body.style.overflow = '';
  }

  // Buttons: both About and Contact resume links
  document.addEventListener('click', (e) => {
    const resumeBtn = e.target.closest('.resume-btn, .social-btn[href$=".pdf"]');
    if (!resumeBtn) return;
    e.preventDefault();
    openModal();
  });

  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

// (Contact copy/link functionality removed by request)

