var navLink=document.getElementById("navLinks");
function showMenu(){
    navLink.style.right="0";
}
function hideMenu(){
    navLink.style.right="-200px";
}
//teacher grid carousel
window.addEventListener('load', () => {
      const carousel = document.getElementById('teachersGrid');
      
      if (!carousel) return;

      const scrollSpeed = 3000; // Time interval (3 seconds)
      let autoScrollTimer = null;

      function startAutoScroll() {
        if (autoScrollTimer) clearInterval(autoScrollTimer);

        autoScrollTimer = setInterval(() => {
          const firstCard = carousel.querySelector('.teacher-card');
          if (!firstCard) return;

          // Card width + Gap width (240 + 20 = 260)
          const scrollStep = firstCard.offsetWidth + 20;

          // Check if scrolled near the end
          const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;

          if (carousel.scrollLeft >= maxScrollLeft - 10) {
            carousel.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            carousel.scrollBy({ left: scrollStep, behavior: 'smooth' });
          }
        }, scrollSpeed);
      }

      function stopAutoScroll() {
        if (autoScrollTimer) clearInterval(autoScrollTimer);
      }

      // Start scrolling
      startAutoScroll();

      // Pause on mouse hover / Resume on mouse leave
      carousel.addEventListener('mouseenter', stopAutoScroll);
      carousel.addEventListener('mouseleave', startAutoScroll);

      // Mobile Touch support
      carousel.addEventListener('touchstart', stopAutoScroll, { passive: true });
      carousel.addEventListener('touchend', startAutoScroll);
    });
