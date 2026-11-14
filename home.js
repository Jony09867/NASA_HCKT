// Enhance only the home-page reveal; content remains visible without JavaScript.
const homeAbout = document.querySelector('.about');
if (homeAbout && 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      homeAbout.classList.add('is-visible');
      observer.disconnect();
    }
  }, { threshold: 0.15 });
  document.documentElement.classList.add('home-motion');
  observer.observe(homeAbout);
}
