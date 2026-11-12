(function () {
  'use strict';
  var SUPABASE_URL = 'https://xuvooubfcvwemicxlxnd.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_g7qG2_dtt3KcQ1HXCP2QIw_DebnWa_n';
  var db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  var $ = function (id) { return document.getElementById(id); };
  var vai = null;
  var abertoEm = Date.now();

  function go(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.toggle('on', s.id === id); });
    window.scrollTo(0, 0);
  }
  function limpo(s) { return String(s || '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim(); }

  function pick(b) {
    vai = b;
    $('b-sim').setAttribute('aria-pressed', String(b));
    $('b-nao').setAttribute('aria-pressed', String(!b));
    $('e-vai').textContent = '';
    $('box-comp').style.display = b ? 'block' : 'none';
  }

  function addComp() {
    if ($('comps').children.length >= 10) return;
    var linha = document.createElement('div');
    linha.className = 'comp';
    var inp = document.createElement('input');
    inp.maxLength = 80;
    inp.placeholder = 'Nome do acompanhante';
    inp.setAttribute('aria-label', 'Nome do acompanhante');
    var x = document.createElement('button');
    x.type = 'button'; x.className = 'x'; x.textContent = '×';
    x.setAttribute('aria-label', 'Remover acompanhante');
    x.addEventListener('click', function () { linha.remove(); });
    linha.appendChild(inp); linha.appendChild(x);
    $('comps').appendChild(linha);
    inp.focus();
  }

  function resetForm() {
    $('nome').value = ''; $('comps').textContent = ''; vai = null;
    $('b-sim').setAttribute('aria-pressed', 'false'); $('b-nao').setAttribute('aria-pressed', 'false');
    $('box-comp').style.display = 'block'; $('e-envio').textContent = '';
  }

  var enviando = false;
  async function enviar() {
    if (enviando) return;
    var nome = limpo($('nome').value), ok = true;
    $('e-envio').textContent = '';
    if (nome.length < 2) { $('e-nome').textContent = 'Escreva seu nome para a gente saber quem é.'; ok = false; }
    if (vai === null) { $('e-vai').textContent = 'Escolha se você vai ou não.'; ok = false; }
    if (!ok) return;
    if ($('site').value || Date.now() - abertoEm < 2500) { mostrarObrigado(nome, vai, []); return; }
    var comps = vai ? Array.prototype.map.call($('comps').querySelectorAll('input'), function (i) { return limpo(i.value); })
      .filter(function (n) { return n.length >= 2; }).slice(0, 10) : [];
    enviando = true; $('b-enviar').setAttribute('aria-busy', 'true'); $('b-enviar').textContent = 'Enviando…';
    try {
      var r = await db.rpc('confirmar_presenca', { p_nome: nome, p_vai: vai, p_acompanhantes: comps });
      if (r.error) {
        $('e-envio').textContent = (r.error.code === 'P0001' && r.error.message) ? r.error.message : 'Não deu para enviar agora. Confira sua internet e tente de novo.';
        return;
      }
      mostrarObrigado(nome, vai, comps);
    } catch (e) {
      $('e-envio').textContent = 'Não deu para enviar agora. Confira sua internet e tente de novo.';
    } finally {
      enviando = false; $('b-enviar').removeAttribute('aria-busy'); $('b-enviar').textContent = 'Enviar confirmação';
    }
  }

  function mostrarObrigado(nome, v, comps) {
    var p = nome.split(' ')[0];
    $('t-titulo').textContent = v ? 'Obrigada, ' + p + '!' : 'Que pena, ' + p + '!';
    $('t-msg').textContent = v
      ? (comps.length ? 'Te esperamos com ' + comps.join(', ') + ' no dia 27 de dezembro, ao meio-dia.' : 'Te esperamos no dia 27 de dezembro, ao meio-dia.')
      : 'Obrigada por avisar. Vamos sentir sua falta.';
    resetForm();
    go('s-thanks');
  }

  async function entrar() {
    $('e-login').textContent = '';
    var email = limpo($('em').value).toLowerCase(), senha = $('pw').value;
    if (!email || !senha) { $('e-login').textContent = 'Preencha e-mail e senha.'; return; }
    $('b-entrar').setAttribute('aria-busy', 'true');
    var r = await db.auth.signInWithPassword({ email: email, password: senha });
    $('b-entrar').removeAttribute('aria-busy');
    $('pw').value = '';
    if (r.error) { $('e-login').textContent = 'E-mail ou senha incorretos.'; return; }
    go('s-admin'); carregar();
  }

  async function carregar() {
    $('e-admin').textContent = '';
    var r = await db.from('confirmacoes').select('id,nome,vai,acompanhantes,criado_em').order('criado_em', { ascending: false }).limit(1000);
    if (r.error) { $('e-admin').textContent = 'Não foi possível carregar a lista.'; return; }
    var lista = $('lista'); lista.textContent = '';
    var total = 0, nao = 0;
    if (!r.data.length) {
      var v = document.createElement('p'); v.className = 'vazio'; v.textContent = 'Ninguém respondeu ainda.'; lista.appendChild(v);
    }
    r.data.forEach(function (d) {
      if (d.vai) total += 1 + d.acompanhantes.length; else nao++;
      var row = document.createElement('div'); row.className = 'row';
      var esq = document.createElement('div'); esq.textContent = d.nome;
      if (d.acompanhantes.length) { var s = document.createElement('small'); s.textContent = 'com ' + d.acompanhantes.join(', '); esq.appendChild(s); }
      var dt = document.createElement('small');
      dt.textContent = new Date(d.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      esq.appendChild(dt);
      var dir = document.createElement('div'); dir.className = 'right';
      var tag = document.createElement('span'); tag.className = 'tag ' + (d.vai ? 'sim' : 'nao');
      tag.textContent = d.vai ? 'Vai · ' + (1 + d.acompanhantes.length) : 'Não vai';
      var del = document.createElement('button'); del.type = 'button'; del.className = 'del'; del.textContent = 'Remover';
      del.addEventListener('click', function () { remover(d.id, d.nome); });
      dir.appendChild(tag); dir.appendChild(del);
      row.appendChild(esq); row.appendChild(dir); lista.appendChild(row);
    });
    $('n-vai').textContent = String(total); $('n-nao').textContent = String(nao);
  }

  async function remover(id, nome) {
    if (!window.confirm('Remover a resposta de ' + nome + '?')) return;
    var r = await db.from('confirmacoes').delete().eq('id', id);
    if (r.error) { $('e-admin').textContent = 'Não foi possível remover.'; return; }
    carregar();
  }

  async function sair() { await db.auth.signOut(); history.replaceState(null, '', location.pathname); go('s-invite'); }

  async function rota() {
    if (location.hash === '#anfitrioes') {
      var s = await db.auth.getSession();
      if (s.data && s.data.session) { go('s-admin'); carregar(); } else { go('s-login'); }
    } else { go('s-invite'); }
  }

  $('b-abrir').addEventListener('click', function () { go('s-form'); });
  $('b-sim').addEventListener('click', function () { pick(true); });
  $('b-nao').addEventListener('click', function () { pick(false); });
  $('b-add').addEventListener('click', addComp);
  $('b-enviar').addEventListener('click', enviar);
  $('b-voltar1').addEventListener('click', function () { go('s-invite'); });
  $('b-voltar2').addEventListener('click', function () { go('s-invite'); });
  $('b-entrar').addEventListener('click', entrar);
  $('pw').addEventListener('keydown', function (e) { if (e.key === 'Enter') entrar(); });
  $('b-atualizar').addEventListener('click', carregar);
  $('b-sair').addEventListener('click', sair);
  $('nome').addEventListener('input', function () { $('e-nome').textContent = ''; });
  window.addEventListener('hashchange', rota);
  rota();
})();
