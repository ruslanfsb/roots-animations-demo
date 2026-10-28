/*
 * Roots Flowers — анимации витрины.
 * Подключение: <script src="/roots-animations.js" defer></script> перед </body>.
 * Без внешних библиотек. Ничего не прячет, пока не убедится, что всё работает:
 * элементы скрываются только после того, как скрипт поставил класс .ra на <html>.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  if (root.hasAttribute('data-ra-off')) return;
  if (!('IntersectionObserver' in window) || !window.requestAnimationFrame) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var observer = null;

  root.classList.add('ra');

  /* ---------- Появление при прокрутке «лесенкой» ---------- */

  var REVEAL = [
    '.story',
    '#main_categories .main_category',
    '.catalog .item',
    '#popular_toggler_title',
    '.h_with_button',
    '#b_categories .h2',
    '.b .d > .h2',
    '.b h2.h3'
  ].join(',');

  function revealDone(el) {
    el.removeAttribute('data-ra-reveal');
    el.classList.remove('ra-in');
    el.style.removeProperty('--ra-delay');
  }

  if (!reduceMotion) {
    var viewportBottom = window.innerHeight;
    observer = new IntersectionObserver(function (entries) {
      var visible = entries
        .filter(function (e) { return e.isIntersecting; })
        .map(function (e) { return e.target; })
        .sort(function (a, b) {
          var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
          return (ra.top - rb.top) || (ra.left - rb.left);
        });
      visible.forEach(function (el, i) {
        observer.unobserve(el);
        el.style.setProperty('--ra-delay', Math.min(i, 6) * 90 + 'ms');
        el.classList.add('ra-in');
        var finish = function (ev) {
          if (ev && ev.target !== el) return;
          el.removeEventListener('transitionend', finish);
          revealDone(el);
        };
        el.addEventListener('transitionend', finish);
        setTimeout(finish, 1600 + Math.min(i, 6) * 90);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    $$(REVEAL).forEach(function (el) {
      // То, что уже видно при загрузке, не трогаем — так ничего не мигает.
      var rect = el.getBoundingClientRect();
      if (el.offsetParent === null && !el.closest('.popular_catalog')) return;
      if (rect.top < viewportBottom && rect.bottom > 0 && el.offsetParent !== null) return;
      el.setAttribute('data-ra-reveal', '');
      observer.observe(el);
    });
  }

  /* ---------- Вкладки «Акции / Популярное / Новинки» ---------- */

  function animateVisibleCatalog(attempt) {
    var shown = $$('#popular_catalogs .popular_catalog').filter(function (c) { return c.offsetParent !== null; });
    if (!shown.length) {
      // Сайт может переключать вкладку с задержкой — подождём пару кадров.
      if (attempt < 20) requestAnimationFrame(function () { animateVisibleCatalog(attempt + 1); });
      return;
    }
    shown.forEach(function (catalog) {
      $$('.item[data-ra-reveal]', catalog).forEach(function (item) {
        if (observer) observer.unobserve(item);
        revealDone(item);
      });
      catalog.classList.remove('ra-tab-in');
      void catalog.offsetWidth;
      catalog.classList.add('ra-tab-in');
      clearTimeout(catalog._raTimer);
      catalog._raTimer = setTimeout(function () { catalog.classList.remove('ra-tab-in'); }, 1400);
    });
  }

  /* ---------- Клики: корзина, избранное, вкладки ---------- */

  function restartClass(el, cls, ms) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    clearTimeout(el['_ra_' + cls]);
    el['_ra_' + cls] = setTimeout(function () { el.classList.remove(cls); }, ms);
  }

  document.addEventListener('click', function (e) {
    var target = e.target;
    if (!(target instanceof Element)) return;

    if (target.closest('#popular_toggler .el')) {
      if (!reduceMotion) requestAnimationFrame(function () { animateVisibleCatalog(0); });
      return;
    }

    if (reduceMotion) return;

    if (target.closest('.button_buy, .buy_button')) {
      // Даём сайту обработать добавление, потом подбрасываем иконку корзины.
      setTimeout(function () {
        $$('.cart_top').forEach(function (cart) { restartClass(cart, 'ra-bump', 800); });
      }, 120);
      return;
    }

    var fav = target.closest('.favorite');
    if (fav) {
      restartClass(fav, 'ra-pop', 600);
      var ring = document.createElement('span');
      ring.className = 'ra-ring';
      ring.addEventListener('animationend', function () { ring.remove(); });
      fav.appendChild(ring);
      setTimeout(function () { ring.remove(); }, 1000);
    }
  });

  /* ---------- Бейджи скидки пульсируют вразнобой ---------- */

  $$('.badge.sale, .badge.big_sale').forEach(function (badge, i) {
    badge.style.setProperty('--ra-badge-delay', (1.5 + ((i * 2.3) % 7)).toFixed(1) + 's');
  });

})();
