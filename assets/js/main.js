/* Maria Júlia do Egito — interações e animações de rolagem (sem dependências) */
(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Entrada da página ---------- */
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-loaded')));
  const ano = $('#ano');
  if (ano) ano.textContent = new Date().getFullYear();

  const percentual = document.getElementById('percentual-online');

if (percentual && !reduce) {
  const duracao = 1500; // 1,5 segundo
  const inicio = performance.now();
  percentual.textContent = '0%';

  function animar(agora) {
    const progresso = Math.min((agora - inicio) / duracao, 1);
    percentual.textContent = `${Math.floor(progresso * 100)}%`;

    if (progresso < 1) {
      requestAnimationFrame(animar);
    }
  }

  requestAnimationFrame(animar);
}

  /* ---------- Menu mobile ---------- */
  const header = $('.header');
  const nav = $('.nav');
  const burger = $('.burger');
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    header.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  matchMedia('(min-width: 1024px)').addEventListener('change', () => setMenu(false));

  /* ---------- Revelação ao rolar ---------- */
  const reveal = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      en.target.classList.add('is-in');
      reveal.unobserve(en.target);
    }
  }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal]').forEach((el) => reveal.observe(el));

  /* Passos da linha do tempo acendem quando cruzam o meio da tela */
  const stepIO = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) en.target.classList.add('is-in');
  }, { rootMargin: '0px 0px -38% 0px' });
  $$('.step').forEach((el) => stepIO.observe(el));

  /* ---------- Link ativo do menu ---------- */
  const links = new Map($$('.nav ul a').map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      links.forEach((a) => a.classList.remove('is-active'));
      links.get(en.target.id)?.classList.add('is-active');
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });

  /* ---------- Efeitos ligados à rolagem ---------- */
  const bar = $('.progress span');
  const wa = $('.wa');
  const steps = $('.steps');
  const parallax = $$('[data-parallax]').map((el) => ({ el, speed: parseFloat(el.dataset.parallax) }));
  const imgs = $$('[data-parallax-img]');
  let lastY = scrollY;
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = scrollY;
    const vh = innerHeight;
    const max = root.scrollHeight - vh;

    bar.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);

    /* cabeçalho: fundo ao sair do topo, some ao descer e volta ao subir */
    header.classList.toggle('is-stuck', y > 24);
    if (!nav.classList.contains('is-open')) {
      if (y > lastY + 6 && y > 420) header.classList.add('is-hidden');
      else if (y < lastY - 6 || y < 420) header.classList.remove('is-hidden');
    }
    lastY = y;

    wa.classList.toggle('is-on', y > vh * 0.6);

    /* linha do tempo preenche conforme o progresso na seção */
    if (steps) {
      const r = steps.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh * 0.62 - r.top) / r.height));
      steps.style.setProperty('--p', p.toFixed(4));
    }

    if (reduce) return;

    /* parallax de elementos decorativos */
    for (const { el, speed } of parallax) {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const d = (r.top + r.height / 2 - vh / 2) * speed;
      el.style.translate = `0 ${d.toFixed(1)}px`;
    }
    /* parallax interno das fotos (a imagem desliza dentro da moldura) */
    for (const img of imgs) {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      const t = (r.top + r.height / 2 - vh / 2) / vh; // -0.5 … 0.5
      img.style.translate = `0 ${(t * -9).toFixed(2)}%`;
    }
  };

  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();

  /* ---------- Micro-interação: cartões seguem levemente o cursor ---------- */
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.plan').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.rotate = `${(x * 2).toFixed(2)}deg`;
        card.style.translate = `${(x * 6).toFixed(1)}px ${(y * 4).toFixed(1)}px`;
      });
      card.addEventListener('pointerleave', () => { card.style.rotate = ''; card.style.translate = ''; });
    });
  }
})();
