(() => {
  const script = document.currentScript;
  const root = new URL('./', script.src);
  const style = document.createElement('link');
  style.rel = 'stylesheet'; style.href = new URL('game-menu.css', root); document.head.append(style);
  const nav = document.createElement('nav'); nav.className = 'game-menu'; nav.setAttribute('aria-label', 'Jogos');
  nav.innerHTML = '<strong>GameExp</strong><small>MINIGAMES</small>';
  [['index.html', '01', 'Survivor Box'], ['disjuntores/index.html', '02', 'Disjuntores e fusíveis'], ['9-card-siege/index.html', '03', '9 Card Siege']].forEach(([path, number, title]) => {
    const a = document.createElement('a'); a.href = new URL(path, root); a.innerHTML = `<span>${number}</span>${title}`;
    if (a.pathname === location.pathname) a.setAttribute('aria-current', 'page');
    nav.append(a);
  });
  const sonar = document.createElement('a'); sonar.href = new URL('sonar/index.html', root); sonar.innerHTML = '<span>05</span>Sonar — Comando solitário'; if (sonar.pathname === location.pathname) sonar.setAttribute('aria-current', 'page'); nav.append(sonar);
  const note = document.createElement('p'); note.textContent = 'Protótipos locais'; nav.append(note);
  document.body.prepend(nav); document.body.classList.add('with-game-menu');
})();

