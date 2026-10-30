/* OLSLEEPTECH · scripts communs */

/* ---------- CONFIGURATION À COMPLÉTER ----------
   Liens de paiement Stripe (Payment Links), un par tarif.
   Créer les liens dans le tableau de bord Stripe puis coller l'URL ici.
   Le numéro de dossier est transmis en client_reference_id et l'email est prérempli. */
const PAY_LINKS = {
  "250": "", // ex. https://buy.stripe.com/xxxxx
  "275": ""
};

/* Tarifs domicile par département */
const ZONES = {
  "75": {price: 250, label: "Paris"},
  "92": {price: 250, label: "Hauts-de-Seine"},
  "93": {price: 250, label: "Seine-Saint-Denis"},
  "94": {price: 250, label: "Val-de-Marne"},
  "95": {price: 250, label: "Val-d'Oise"},
  "78": {price: 275, label: "Yvelines"},
  "77": {price: 275, label: "Seine-et-Marne"},
  "91": {price: 275, label: "Essonne"}
};

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* Menu */
const nav = $('#nav');
$('.burger')?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  $('.burger').setAttribute('aria-expanded', open);
});
$$('.menu > li > button').forEach(b => b.addEventListener('click', e => {
  const li = b.parentElement;
  const was = li.classList.contains('open');
  $$('.menu > li').forEach(x => x.classList.remove('open'));
  if (!was) li.classList.add('open');
  b.setAttribute('aria-expanded', !was);
  e.stopPropagation();
}));
document.addEventListener('click', e => {
  if (!e.target.closest('.menu')) $$('.menu > li').forEach(x => x.classList.remove('open'));
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { $$('.menu > li').forEach(x => x.classList.remove('open')); nav?.classList.remove('open'); }
});

/* Apparitions au scroll */
const revealEls = $$('.card,.step,.split>*,.zone,.includes,.note-box,.pay,.cta,details,.ccard,.form,.stat,.tl,.person,.quiz,.checker,.table-wrap');
if ('IntersectionObserver' in window) {
  revealEls.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), {threshold: .1});
  revealEls.forEach(el => io.observe(el));
}

/* Cookies */
function getConsent() { try { return localStorage.getItem('ols-consent'); } catch (e) { return null; } }
function setCookies(v) {
  try { localStorage.setItem('ols-consent', v); } catch (e) {}
  $('#cookie')?.classList.remove('show');
  if (v === 'tout') loadTracking();
}
function showCookies() { $('#cookie')?.classList.add('show'); }
function loadTracking() {
  /* TODO : coller ici Google Analytics 4 et la balise Google Ads une fois les comptes créés.
     Rien n'est chargé tant que le visiteur n'a pas cliqué sur « Tout accepter ». */
}
if (!getConsent()) setTimeout(showCookies, 900); else if (getConsent() === 'tout') loadTracking();
window.setCookies = setCookies; window.showCookies = showCookies;

/* Paramètres d'URL (ex. contact.html?type=pro&besoin=cardio) */
const params = new URLSearchParams(location.search);

/* Vérificateur de tarif */
function lookupZone(val) {
  const v = (val || '').replace(/\s/g, '');
  if (!/^\d{2}(\d{3})?$/.test(v)) return {err: "Entrez un code postal à 5 chiffres ou un numéro de département."};
  const dep = v.slice(0, 2);
  const z = ZONES[dep];
  if (!z) return {out: true, dep};
  return {dep, ...z};
}
$$('[data-checker]').forEach(box => {
  const input = $('input', box), res = $('.result', box);
  const run = () => {
    const r = lookupZone(input.value);
    res.className = 'result show';
    if (r.err) { res.classList.add('warn'); res.textContent = r.err; return; }
    if (r.out) { res.classList.add('warn'); res.innerHTML = "Le département " + r.dep + " n'est pas encore couvert par l'examen à domicile. <a class='link' href='contact.html'>Contactez-nous</a>, on regarde ce qu'on peut faire."; return; }
    res.innerHTML = "<span class='big'>" + r.price + " €</span>" + r.label + " (" + r.dep + ") · pose, récupération et interprétation incluses. <a class='link' href='contact.html?dep=" + r.dep + "'>Prendre rendez-vous</a>";
  };
  $('button', box).addEventListener('click', run);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); run(); } });
});

/* Auto-évaluation */
const quiz = $('#quiz');
if (quiz) {
  const qs = $$('.q', quiz), res = $('.quiz-res', quiz);
  qs.forEach(q => $$('button', q).forEach(b => b.addEventListener('click', () => {
    $$('button', q).forEach(x => x.classList.remove('on'));
    b.classList.add('on'); q.dataset.v = b.dataset.v; update();
  })));
  function update() {
    const done = qs.filter(q => q.dataset.v).length;
    if (done < qs.length) { res.classList.remove('show'); return; }
    const yes = qs.filter(q => q.dataset.v === '1').length;
    $('.meter i', res).style.width = (yes / qs.length * 100) + '%';
    $('.score', res).textContent = yes + ' réponse' + (yes > 1 ? 's' : '') + ' « oui » sur ' + qs.length;
    $('.msg', res).innerHTML = yes >= 3
      ? "Plusieurs signes évocateurs. Parlez-en à votre médecin traitant : lui seul peut prescrire un examen du sommeil. <a class='link' href='examen.html'>Voir comment se passe l'examen</a>"
      : "Peu de signes évocateurs. Si vous avez un doute ou si vous êtes fatigué malgré des nuits complètes, parlez-en tout de même à votre médecin.";
    res.classList.add('show');
  }
}

/* FAQ : filtres et recherche */
const faq = $('#faq-list');
if (faq) {
  let cat = 'all';
  const items = $$('details', faq), input = $('#faq-search'), empty = $('.empty');
  const apply = () => {
    const q = (input.value || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    let n = 0;
    items.forEach(d => {
      const txt = d.textContent.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const ok = (cat === 'all' || d.dataset.cat === cat) && (!q || txt.includes(q));
      d.style.display = ok ? '' : 'none'; if (ok) n++;
    });
    $$('.faq-group', faq).forEach(g => g.style.display = $$('details', g).some(d => d.style.display !== 'none') ? '' : 'none');
    empty.style.display = n ? 'none' : 'block';
  };
  $$('.filters button').forEach(b => b.addEventListener('click', () => {
    $$('.filters button').forEach(x => x.classList.remove('on')); b.classList.add('on'); cat = b.dataset.cat; apply();
  }));
  input.addEventListener('input', apply);
  if (params.get('cat')) $(`.filters button[data-cat="${params.get('cat')}"]`)?.click();
}

/* Formulaire de contact : patient ou professionnel */
const cform = $('#contact-form');
if (cform) {
  const setType = t => {
    $$('.seg button', cform).forEach(b => b.classList.toggle('on', b.dataset.t === t));
    $('[name=profil]', cform).value = t === 'pro' ? 'Professionnel de santé' : 'Patient';
    $('#f-patient').style.display = t === 'pro' ? 'none' : '';
    $('#f-pro').style.display = t === 'pro' ? '' : 'none';
    $$('#f-pro [data-req]').forEach(i => i.required = t === 'pro');
    $$('#f-patient [data-req]').forEach(i => i.required = t !== 'pro');
  };
  $$('.seg button', cform).forEach(b => b.addEventListener('click', () => setType(b.dataset.t)));
  setType(params.get('type') === 'pro' ? 'pro' : 'patient');
  if (params.get('dep')) { const s = $('[name=departement]', cform); if (s) s.value = params.get('dep'); }
  if (params.get('besoin')) { const s = $('[name=besoin]', cform); const o = $$('option', s).find(o => o.dataset.k === params.get('besoin')); if (o) s.value = o.value; }
}

/* Paiement */
const pform = $('#pay-form');
if (pform) {
  const sel = $('[name=departement]', pform), box = $('.amount-box b', pform);
  const upd = () => { const z = ZONES[sel.value]; box.textContent = z ? z.price + ' €' : '— €'; };
  sel.addEventListener('change', upd); upd();
  pform.addEventListener('submit', e => {
    e.preventDefault();
    const z = ZONES[sel.value], msg = $('.form-msg', pform);
    const link = z && PAY_LINKS[String(z.price)];
    if (!link) {
      msg.innerHTML = "Le paiement en ligne sera activé très prochainement. En attendant, réglez sur place ou contactez-nous au <a class='link' href='tel:+33771013809'>07 71 01 38 09</a>.";
      msg.style.display = 'block'; return;
    }
    const u = new URL(link);
    u.searchParams.set('client_reference_id', $('[name=dossier]', pform).value.replace(/[^\w-]/g, ''));
    u.searchParams.set('prefilled_email', $('[name=email]', pform).value);
    msg.textContent = 'Redirection vers le paiement sécurisé…'; msg.style.display = 'block';
    location.href = u.toString();
  });
}

/* Espace connecté (maquette) */
const auth = $('#auth');
if (auth) {
  const txt = {
    patient: {d: "Suivez votre rendez-vous, retrouvez vos factures et recevez vos résultats.", f: ["Date et heure de la pose", "Factures et reçus de paiement", "Résultats transmis par email"]},
    pro: {d: "Gérez vos demandes de techniciens, vos plannings et votre facturation.", f: ["Demandes de techniciens et suivi", "Planning des interventions", "Comptes rendus et factures"]},
    tech: {d: "Consultez vos interventions à venir et vos paiements.", f: ["Planning des poses et retraits", "Adresses et consignes", "Suivi de vos paiements"]}
  };
  const sel = k => {
    $$('.tabs3 button', auth).forEach(b => b.classList.toggle('on', b.dataset.s === k));
    $('.desc', auth).textContent = txt[k].d;
    $('.feats', auth).innerHTML = txt[k].f.map(x => `<div class="feat">${x}</div>`).join('');
  };
  $$('.tabs3 button', auth).forEach(b => b.addEventListener('click', () => sel(b.dataset.s)));
  sel(['patient', 'pro', 'tech'].includes(params.get('espace')) ? params.get('espace') : 'patient');
  $('form', auth).addEventListener('submit', e => { e.preventDefault(); $('.form-msg', auth).style.display = 'block'; });
}

/* Année du pied de page */
$$('.year').forEach(y => y.textContent = new Date().getFullYear());
