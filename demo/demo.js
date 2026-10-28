/*
 * Обвязка только для демо-копии страницы.
 * В статичной копии нет скриптов сайта, поэтому здесь минимально оживлены
 * слайдеры, вкладки «Акции / Популярное / Новинки», избранное и плашка демо.
 * На настоящий сайт этот файл НЕ переносится.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var off = root.hasAttribute('data-ra-off');
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Плашка демо ---------- */
  var bar = document.createElement('div');
  bar.className = 'rd-bar';
  bar.innerHTML =
    '<span class="rd-bar__title">Демо анимаций для Roots Flowers · подготовил Руслан</span>' +
    '<span class="rd-bar__switch" role="group" aria-label="Режим просмотра">' +
    '<a href="./" class="' + (off ? '' : 'is-active') + '">С анимациями</a>' +
    '<a href="./?off" class="' + (off ? 'is-active' : '') + '">Как сейчас</a>' +
    '</span>';
  document.body.insertBefore(bar, document.body.firstChild);

  /* ---------- Картинки, которые сайт подставляет скриптом ---------- */
  var mobile = window.matchMedia('(max-width: 1024px)');
  function setCategoryImages() {
    $$('#main_categories .main_category').forEach(function (a) {
      var src = (mobile.matches && a.getAttribute('data-img-mobile')) || a.getAttribute('data-img');
      if (src) a.style.backgroundImage = 'url("' + src + '")';
    });
  }
  setCategoryImages();
  if (mobile.addEventListener) mobile.addEventListener('change', setCategoryImages);
  $$('a[data-src]:not(.owl-lazy), div[data-src]:not(.owl-lazy)').forEach(function (e) {
    if (!e.style.backgroundImage && e.closest('.news_carousel, .personal_slider')) {
      e.style.backgroundImage = 'url("' + e.getAttribute('data-src') + '")';
    }
  });

  /* ---------- Главный слайдер ---------- */
  function initMainSlider(el) {
    var outer = el.querySelector('.owl-stage-outer');
    var stage = el.querySelector('.owl-stage');
    if (!outer || !stage) return;
    var items = $$('.owl-item', stage);
    var dots = $$('.owl-dot', el);
    var index = Math.max(0, items.findIndex(function (i) { return i.classList.contains('active'); }));

    function go(n) {
      index = (n + items.length) % items.length;
      stage.style.transform = 'translate3d(' + (-index * 100) + '%, 0, 0)';
      items.forEach(function (it, k) { it.classList.toggle('active', k === index); });
      dots.forEach(function (d, k) { d.classList.toggle('active', k === index); });
    }

    var prev = el.querySelector('.owl-prev');
    var next = el.querySelector('.owl-next');
    if (prev) prev.addEventListener('click', function () { go(index - 1); restart(); });
    if (next) next.addEventListener('click', function () { go(index + 1); restart(); });
    dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); restart(); }); });

    var timer = null;
    function restart() {
      clearInterval(timer);
      timer = setInterval(function () { if (!document.hidden) go(index + 1); }, 6500);
    }
    el.addEventListener('mouseenter', function () { clearInterval(timer); });
    el.addEventListener('mouseleave', restart);

    // Свайп на телефоне.
    var startX = null;
    el.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { go(index + (dx < 0 ? 1 : -1)); restart(); }
      startX = null;
    }, { passive: true });

    go(index);
    restart();
  }
  $$('.owl-carousel.main_slider').forEach(initMainSlider);

  /* ---------- Остальные карусели: обычная горизонтальная прокрутка ---------- */
  $$('.owl-carousel:not(.main_slider)').forEach(function (el) {
    var outer = el.querySelector('.owl-stage-outer');
    var stage = el.querySelector('.owl-stage');
    if (!outer || !stage) return;
    el.classList.add('rd-scroller');
    $$('.owl-item', stage).forEach(function (it) { it.classList.add('active'); });
    var step = function () { return Math.max(240, outer.clientWidth * 0.8); };
    var prev = el.querySelector('.owl-prev');
    var next = el.querySelector('.owl-next');
    if (prev) prev.addEventListener('click', function () { outer.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { outer.scrollBy({ left: step(), behavior: 'smooth' }); });
    var dots = el.querySelector('.owl-dots');
    if (dots) dots.style.display = 'none';
  });

  /* ---------- Вкладки «Акции / Популярное / Новинки» ---------- */
  var tabs = $$('#popular_toggler .el');
  var catalogs = $$('#popular_catalogs .popular_catalog');
  var buttons = $$('#popular_buttons a');
  tabs.forEach(function (tab, k) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t, j) { t.classList.toggle('selected', j === k); });
      catalogs.forEach(function (c, j) { c.style.display = j === k ? '' : 'none'; });
      buttons.forEach(function (b, j) { b.style.display = j === k ? '' : 'none'; });
    });
  });

  /* ---------- Избранное, корзина, cookie ---------- */
  document.addEventListener('click', function (e) {
    var fav = e.target.closest('.favorite');
    if (fav) { fav.classList.toggle('favorited'); return; }
    var buy = e.target.closest('.button_buy, .button_fast, .buy_button');
    if (buy) { e.preventDefault(); return; }
    var cookie = e.target.closest('.cookie_wrap button');
    if (cookie) { cookie.closest('.cookie_wrap').style.display = 'none'; }
  });
})();
