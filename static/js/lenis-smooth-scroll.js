document.addEventListener('DOMContentLoaded', function() {
  // Check if Lenis is available
  if (typeof Lenis === 'undefined') {
    console.warn('Lenis is not loaded');
    return;
  }

  // Init Lenis
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutCubic
    smoothWheel: true,
    touchMultiplier: 2,
    infinite: false,
  });

  // requestAnimationFrame: continuously update scroll
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  // Handle anchor links for smooth scrolling
  const handleAnchorClick = (e) => {
    const target = e.target.closest('a');
    if (target && target.hash) {
      e.preventDefault();
      const element = document.querySelector(target.hash);
      if (element) {
        lenis.scrollTo(element, { duration: 1.5 });
      }
    }
  };

  // Event listeners for anchor links
  document.addEventListener('click', handleAnchorClick);

  // Expose lenis instance globally for debugging
  window.lenis = lenis;
});
