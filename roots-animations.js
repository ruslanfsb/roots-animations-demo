/*
 * Roots Flowers — анимации главной страницы.
 * Раскадровка: Figma «Roots Flowers — Motion концепция главной».
 * Подключение: <script src="/roots-animations.js" defer></script> перед </body>.
 * Без внешних библиотек. Элементы прячутся только после того, как скрипт поставил
 * класс .ra на <html>, поэтому без JS страница выглядит как обычно.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  if (root.hasAttribute('data-ra-off')) return;
  if (!('IntersectionObserver' in window) || !window.requestAnimationFrame) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var observer = null;

  root.classList.add('ra');

  function isVisible(el) { return el.offsetParent !== null || getComputedStyle(el).position === 'fixed'; }
  function inViewport(el) {
    var r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  }

  /* ---------- Разбивка текста на слова для «маски» ---------- */

  function splitWords(el) {
    if (el.hasAttribute('data-ra-split')) return;
    el.setAttribute('data-ra-split', '');
    var index = 0;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      // Делим только по обычным пробелам и переносам: неразрывный пробел держит слова вместе.
      var parts = node.nodeValue.split(/([ \t\r\n]+)/);
      if (!/[^ \t\r\n]/.test(node.nodeValue)) return;
      var frag = document.createDocumentFragment();
      parts.forEach(function (part) {
        if (!part) return;
        if (!/[^ \t\r\n]/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        // Свои теги вместо span: стили сайта для «.h1 span» их не задевают.
        var outer = document.createElement('ra-w');
        var inner = document.createElement('ra-wi');
        inner.style.setProperty('--i', index++);
        inner.textContent = part;
        outer.appendChild(inner);
        frag.appendChild(outer);
      });
      node.parentNode.replaceChild(frag, node);
    });
    // «по&nbsp;<i>вашим</i>»: слово перед неразрывным пробелом не должно отрываться от следующего.
    $$('ra-w', el).forEach(function (w) {
      var next = w.nextSibling;
      if (!/ $/.test(w.textContent) || !(next instanceof Element)) return;
      var glue = document.createElement('ra-nb');
      glue.style.whiteSpace = 'nowrap';
      w.parentNode.insertBefore(glue, w);
      glue.appendChild(w);
      glue.appendChild(next);
    });
  }

  if (!reduceMotion) {
    /* ---------- Живой фон и линия прокрутки ---------- */
    var ambient = document.createElement('div');
    ambient.className = 'ra-ambient';
    ambient.setAttribute('aria-hidden', 'true');
    ambient.innerHTML = '<span></span><span></span><span></span>';
    document.body.insertBefore(ambient, document.body.firstChild);

    var progress = document.createElement('div');
    progress.className = 'ra-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progress);

    /* ---------- Заголовки первого экрана ---------- */
    $$('.main_slider .h_slider').forEach(function (h) {
      splitWords(h);
      h.classList.add('ra-split');
    });

    /* ---------- Заголовки разделов: по словам при появлении ---------- */
    var HEADINGS = ['.h1', '.h2', 'h2.h3'].join(',');
    var headingObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        headingObserver.unobserve(e.target);
        e.target.classList.add('ra-words-in');
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.2 });

    $$(HEADINGS).forEach(function (h) {
      if (h.closest('#popular_toggler, .item, .main_slider, #cart_modal, #window, #favorites_wrap, .modal_title')) return;
      if (!isVisible(h) || inViewport(h)) return;
      splitWords(h);
      h.classList.add('ra-words');
      headingObserver.observe(h);
    });

    /* ---------- Появление блоков «лесенкой» ---------- */
    var REVEAL = [
      '.story',
      '#main_categories .main_category',
      '.catalog .item',
      '.h_with_button .btn_wrap',
      '#popular_toggler',
      '#popular_buttons',
      '.news_carousel',
      '.faq_list',
      '.prefer',
      '#contacts .contact',
      '.about_app .left > *',
      '#personal_descr .btn_wrap',
      '.bouquet_week'
    ].join(',');

    var revealDone = function (el) {
      el.removeAttribute('data-ra-reveal');
      el.classList.remove('ra-in');
      el.style.removeProperty('--ra-delay');
    };

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
        var delay = Math.min(i, 6) * 90;
        el.style.setProperty('--ra-delay', delay + 'ms');
        el.classList.add('ra-in');
        var finish = function (ev) {
          if (ev && ev.target !== el) return;
          el.removeEventListener('transitionend', finish);
          revealDone(el);
        };
        el.addEventListener('transitionend', finish);
        setTimeout(finish, 1700 + delay);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    // Плитки категорий скрыты через clip-path, а такие элементы IntersectionObserver
    // не считает видимыми, поэтому их проверяем сами при прокрутке.
    var curtains = [];
    function revealCurtains() {
      var vh = window.innerHeight;
      var due = curtains.filter(function (el) { return el.getBoundingClientRect().top < vh * 0.92; });
      if (!due.length) return;
      curtains = curtains.filter(function (el) { return due.indexOf(el) < 0; });
      due.forEach(function (el, i) {
        var delay = Math.min(i, 6) * 90;
        el.style.setProperty('--ra-delay', delay + 'ms');
        el.classList.add('ra-in');
        setTimeout(function () { revealDone(el); }, 1100 + delay);
      });
    }

    $$(REVEAL).forEach(function (el) {
      var hiddenCatalogItem = el.offsetParent === null && el.closest('.popular_catalog');
      if (!isVisible(el) && !hiddenCatalogItem) return;
      if (!hiddenCatalogItem && inViewport(el)) return; // уже на экране — не мигаем
      el.setAttribute('data-ra-reveal', '');
      if (el.matches('#main_categories .main_category')) curtains.push(el);
      else observer.observe(el);
    });

    /* ---------- Глубина при прокрутке ---------- */
    var parallax = [];
    function addParallax(el, speed, mode) { parallax.push({ el: el, speed: speed, mode: mode, on: false }); }
    $$('.main_slider .img').forEach(function (el) { addParallax(el, 0.12, 'hero'); });
    $$('#personal_imgs .img').forEach(function (el, i) { addParallax(el, [0.05, 0.1, 0.16][i % 3], 'translate'); });
    $$('.about_app .right').forEach(function (el) { addParallax(el, 0.08, 'translate'); });

    var pObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        parallax.forEach(function (p) { if (p.el === e.target) p.on = e.isIntersecting; });
      });
      requestTick();
    }, { rootMargin: '20% 0px 20% 0px' });
    parallax.forEach(function (p) { pObserver.observe(p.el); });

    var ticking = false;
    function requestTick() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      var y = window.pageYOffset;
      var max = document.documentElement.scrollHeight - vh;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
      if (curtains.length) revealCurtains();
      parallax.forEach(function (p) {
        if (!p.on) return;
        if (p.mode === 'hero') {
          p.el.style.setProperty('--ra-py', Math.min(y, vh) * p.speed + 'px');
          return;
        }
        var r = p.el.getBoundingClientRect();
        var offset = (r.top + r.height / 2 - vh / 2) * p.speed;
        p.el.style.translate = '0 ' + offset.toFixed(1) + 'px';
      });
    }
    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', requestTick);
    update();

    /* ---------- Полоски слайдера заполняются за время показа ---------- */
    $$('.main_slider[data-ra-autoplay]').forEach(function (slider) {
      var dots = $$('.owl-dot', slider);
      var idle = dots.filter(function (d) { return !d.classList.contains('active'); })[0];
      var active = dots.filter(function (d) { return d.classList.contains('active'); })[0];
      if (!idle || !active) return;
      slider.style.setProperty('--ra-dot-bg', getComputedStyle(idle).backgroundColor);
      slider.style.setProperty('--ra-dot-fg', getComputedStyle(active).backgroundColor);
      slider.style.setProperty('--ra-autoplay', slider.getAttribute('data-ra-autoplay') + 'ms');
    });

    /* ---------- Наклон карточки за курсором ---------- */
    if (finePointer) {
      document.addEventListener('pointermove', function (e) {
        var wrap = e.target instanceof Element && e.target.closest('.item .img_wrap');
        if (!wrap) return;
        var r = wrap.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        wrap.classList.add('ra-tilting');
        wrap.style.transform = 'perspective(900px) rotateX(' + ((0.5 - y) * 6).toFixed(2) + 'deg) rotateY(' + ((x - 0.5) * 6).toFixed(2) + 'deg)';
        wrap.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
        wrap.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      }, { passive: true });
      document.addEventListener('pointerout', function (e) {
        var wrap = e.target instanceof Element && e.target.closest('.item .img_wrap');
        if (!wrap || (e.relatedTarget instanceof Node && wrap.contains(e.relatedTarget))) return;
        wrap.classList.remove('ra-tilting');
        wrap.style.transform = '';
      });
    }
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
        item.removeAttribute('data-ra-reveal');
        item.classList.remove('ra-in');
      });
      restartClass(catalog, 'ra-tab-in', 1400);
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
