// Generates and prints A4 documents (Devis, Facture, Contrat, Avenant)
// matching the Atelier design system.

// ── Formatters ──────────────────────────────────────────────────────────────

function fmtNum(n, dec = 0) {
    return Number(n || 0).toLocaleString('fr-DZ', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}
function fmtDA(n) { return `${fmtNum(n)} DA` }

function numberToFrenchWords(n) {
    if (!n || n === 0) return 'zéro'
    const ONES = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
        'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
        'dix-sept', 'dix-huit', 'dix-neuf']
    function b100(n) {
        if (n < 20) return ONES[n]
        const t = Math.floor(n / 10), u = n % 10
        if (t === 7) return u === 1 ? 'soixante et onze' : 'soixante-' + ONES[10 + u]
        if (t === 9) return 'quatre-vingt-' + ONES[10 + u]
        const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', '', 'quatre-vingt', '']
        const base = TENS[t]
        if (!u) return base + (t === 8 ? 's' : '')
        if (u === 1 && t !== 8) return base + ' et un'
        return base + '-' + ONES[u]
    }
    function b1000(n) {
        if (!n) return ''
        if (n < 100) return b100(n)
        const h = Math.floor(n / 100), r = n % 100
        const hs = h === 1 ? 'cent' : ONES[h] + ' cent'
        if (!r) return hs + (h > 1 ? 's' : '')
        return hs + ' ' + b100(r)
    }
    const M = Math.floor(n / 1e6), K = Math.floor((n % 1e6) / 1e3), R = n % 1e3
    let s = ''
    if (M) s += b1000(M) + (M === 1 ? ' million ' : ' millions ')
    if (K) s += (K === 1 ? 'mille' : b1000(K) + ' mille') + ' '
    if (R) s += b1000(R)
    return s.trim() || 'zéro'
}

// ── Payment conditions ───────────────────────────────────────────────────────

const COND_LABELS = {
    RECEPTION: 'À réception de la facture',
    '30J': '30 jours nets',
    '45J': '45 jours nets',
    '60J': '60 jours nets',
    PERSONNALISE: 'Selon conditions convenues',
}

// ── Status maps ──────────────────────────────────────────────────────────────

const STATUS = {
    BROUILLON:          { label: 'Brouillon',         cls: 'draft' },
    EMISE:              { label: 'Émise',              cls: 'sent' },
    ENVOYEE:            { label: 'Envoyée',            cls: 'sent' },
    ENVOYE:             { label: 'Envoyé',             cls: 'sent' },
    PARTIELLEMENT_PAYEE:{ label: 'Partiel',            cls: 'partial' },
    SOLDEE:             { label: 'Soldée',             cls: 'paid' },
    ACCEPTE:            { label: 'Accepté',            cls: 'accepted' },
    REFUSE:             { label: 'Refusé',             cls: 'cancelled' },
    SIGNE:              { label: 'Signé',              cls: 'signed' },
    RESILIE:            { label: 'Résilié',            cls: 'cancelled' },
    ANNULEE:            { label: 'Annulée',            cls: 'cancelled' },
}

function badge(statut) {
    const s = STATUS[statut] || { label: statut, cls: 'draft' }
    return `<span class="badge-status ${s.cls}">${s.label}</span>`
}

// ── Shared HTML blocks ───────────────────────────────────────────────────────

function resolveLogoUrl(url) {
    if (!url) return null
    if (url.startsWith('http')) return url
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
        : 'http://127.0.0.1:8000'
    return base + (url.startsWith('/') ? url : '/' + url)
}

// Pre-fetch logo and convert to base64 so it embeds inline in the HTML document,
// avoiding cross-origin failures when the HTML is loaded in a blob/iframe/new window.
async function fetchLogoBase64(url) {
    if (!url) return null
    const fullUrl = resolveLogoUrl(url)
    if (!fullUrl) return null
    try {
        const res = await fetch(fullUrl, { mode: 'cors' })
        if (!res.ok) return fullUrl
        const blob = await res.blob()
        return new Promise(resolve => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = () => resolve(fullUrl)
            reader.readAsDataURL(blob)
        })
    } catch {
        return fullUrl
    }
}

// cab._logoSrc can be pre-set to a base64 data URL by getDocHTMLAsync
function issuerBlock(cab) {
    const logoUrl = cab._logoSrc !== undefined ? cab._logoSrc : resolveLogoUrl(cab.logo)
    const logoHtml = logoUrl
        ? `<img src="${logoUrl}" alt="logo" class="logo-img">`
        : `<div class="logo-slot"></div>`
    const contactLine = [cab.telephone, cab.email].filter(Boolean).join(' · ')
    return `
<div class="doc-issuer-row">
  ${logoHtml}
  <div class="issuer-info">
    <b>${cab.nom || 'Cabinet'}</b>
    ${cab.activite || "Architecte DPLG · Conseil &amp; Maîtrise d'œuvre"}<br>
    ${cab.adresse ? cab.adresse + '<br>' : ''}
    ${contactLine}
    <div class="meta">
      ${cab.nif ? `<span>NIF</span><span>${cab.nif}</span>` : ''}
      ${cab.nis ? `<span>NIS</span><span>${cab.nis}</span>` : ''}
      ${cab.numero_rc ? `<span>RC</span><span>${cab.numero_rc}</span>` : ''}
      ${cab.ai ? `<span>AI</span><span>${cab.ai}</span>` : ''}
    </div>
  </div>
</div>`
}

function partiesBlock(cab, client, leftLabel, rightLabel) {
    const cabFiscal = [
        cab.nif ? 'NIF ' + cab.nif : '',
        cab.nis ? 'NIS ' + cab.nis : '',
        cab.numero_rc ? 'RC ' + cab.numero_rc : '',
        cab.ai ? 'AI ' + cab.ai : '',
    ].filter(Boolean).join(' · ')
    const cabContact = [cab.telephone, cab.email].filter(Boolean).join(' · ')
    const clientFiscal = client?.nif && client.nif !== '—' ? 'NIF ' + client.nif : 'Particulier'
    return `
<div class="doc-parties">
  <div class="party-block">
    <div class="party-label">${leftLabel}</div>
    <div class="party-name">${cab.nom || 'Cabinet'}</div>
    <div class="party-detail">
      ${cab.activite || ''}<br>
      ${cab.adresse ? cab.adresse + '<br>' : ''}
      ${cabContact ? cabContact + '<br>' : ''}
      ${cabFiscal ? `<div class="small">${cabFiscal}</div>` : ''}
    </div>
  </div>
  <div class="party-block">
    <div class="party-label">${rightLabel}</div>
    <div class="party-name">${client?.nom || '—'}</div>
    <div class="party-detail">
      ${client?.contact_nom ? client.contact_nom + '<br>' : ''}
      ${client?.adresse ? client.adresse + '<br>' : ''}
      <div class="small">${clientFiscal} · ${client?.email || ''}</div>
    </div>
  </div>
</div>`
}

function footerBlock(cab) {
    return `
<div class="doc-footer">
  <div><b>${cab.nom || ''}</b>${cab.adresse ? '<br>' + cab.adresse : ''}${cab.telephone ? '<br>' + cab.telephone : ''}</div>
  <div class="center">
    ${cab.nif ? `<b>NIF</b> ${cab.nif}<br>` : ''}
    ${cab.nis ? `<b>NIS</b> ${cab.nis}<br>` : ''}
    ${cab.numero_rc ? `<b>RC</b> ${cab.numero_rc}<br>` : ''}
    ${cab.ai ? `<b>AI</b> ${cab.ai}` : ''}
  </div>
  <div class="right">${cab.email || ''}</div>
</div>`
}

function sigBlock(cab, clientName, type = 'accord') {
    const clientLabel = type === 'accord' ? 'Bon pour accord — Client' : 'Le Maître d\'ouvrage'
    const cabLabel = type === 'accord' ? `Pour ${cab.nom || 'le Cabinet'}` : 'Le Maître d\'œuvre'
    const hint = type === 'accord'
        ? 'Faire précéder de la mention « Bon pour accord », date &amp; signature.'
        : 'Lu et approuvé — Date et signature, précédées de la mention manuscrite.'
    return `
<div class="signature-row">
  <div class="sig-box">
    <div class="sig-label">${cabLabel}</div>
    <div class="sig-name">${cab.nom || ''}</div>
    <div class="sig-hint">Signature et cachet</div>
  </div>
  <div class="sig-box">
    <div class="sig-label">${clientLabel}</div>
    <div class="sig-name">${clientName || ''}</div>
    <div class="sig-hint">${hint}</div>
  </div>
</div>`
}

function totalsBlock(montant_ht, _unused_tva, montant_ttc, paymentHtml, remise = 0, assujetti = true) {
    const htN = Number(montant_ht) || 0
    const ttcN = Number(montant_ttc) || 0
    const vatN = ttcN - htN
    const remD = parseFloat(remise) || 0
    const sousTotalHt = remD > 0 ? htN / (1 - remD / 100) : htN
    return `
<div class="doc-totals">
  <div class="payment-info">
    ${paymentHtml || ''}
  </div>
  <div class="totals-card">
    ${remD > 0 ? `
    <div class="row"><span class="lab">Sous-total HT</span><span class="val">${fmtDA(sousTotalHt)}</span></div>
    <div class="row"><span class="lab">Remise (${remD}%)</span><span class="val" style="color:#EF4444">-${fmtDA(sousTotalHt * remD / 100)}</span></div>
    ` : ''}
    <div class="row"><span class="lab">Total ${assujetti ? 'HT' : ''}</span><span class="val">${fmtDA(htN)}</span></div>
    ${assujetti ? `<div class="row"><span class="lab">TVA</span><span class="val">${fmtDA(vatN)}</span></div>` : ''}
    <div class="row grand"><span class="lab">Total ${assujetti ? 'TTC' : ''}</span><span class="val">${fmtDA(ttcN)}</span></div>
    <div class="amount-in-words">
      Arrêté à la somme de <b>${numberToFrenchWords(Math.round(ttcN))} dinars algériens</b>${assujetti ? ', toutes taxes comprises' : ' — non assujetti à la TVA'}.
    </div>
    ${!assujetti ? `<div style="font-size:10px;color:#64748B;margin-top:4px;font-style:italic;text-align:right;">Non assujetti à la TVA</div>` : ''}
  </div>
</div>`
}

// ── Document generators ──────────────────────────────────────────────────────

function generateDevis(doc, cab, client) {
    const ttcN = Number(doc.montant_ttc) || 0
    const htN = Number(doc.montant_ht) || 0
    const lignes = doc.lignes && doc.lignes.length ? doc.lignes : null
    const condLabel = COND_LABELS[doc.conditions_paiement] || 'À réception de la facture'

    const lignesRows = lignes
        ? lignes.map((l, i) => {
            const totHt = Number(l.quantite || 1) * Number(l.prix_unitaire || 0)
            return `<tr>
          <td class="lineno">${String(i + 1).padStart(2, '0')}</td>
          <td class="desc-cell"><b>${l.designation || ''}</b></td>
          <td class="r">${fmtNum(l.quantite, 2)}</td>
          <td class="r">${fmtNum(l.prix_unitaire, 2)}</td>
          <td class="r">${l.tva || 0}%</td>
          <td class="r">${fmtNum(totHt, 2)}</td>
        </tr>`
          }).join('')
        : `<tr>
          <td class="lineno">01</td>
          <td class="desc-cell"><b>Honoraires de maîtrise d'œuvre architecturale</b>
            <div class="sub">Études complètes — Mission de base (ESQ, APS, APD, DCE, DET, AOR)</div>
          </td>
          <td class="r">1</td>
          <td class="r">${fmtNum(htN, 2)}</td>
          <td class="r">19%</td>
          <td class="r">${fmtNum(htN, 2)}</td>
        </tr>`

    const paymentHtml = `<b>Modalités de règlement</b><br>${condLabel}
         ${doc.rib ? `<br><br><b>Coordonnées bancaires</b><br><span style="font-family:'Geist Mono',monospace;font-size:11px">${doc.rib.replace(/\n/g, '<br>')}</span>` : ''}`

    return `
<div class="doc-paper">
  ${doc.statut === 'BROUILLON' ? '<div class="doc-watermark">BROUILLON</div>' : ''}
  <div class="doc-pad">
    <div class="doc-head">
      ${issuerBlock(cab)}
      <div class="doc-type-block">
        <div class="doc-type-label">Devis</div>
        <div class="doc-type-name">${doc.numero || ''}</div>
        <div class="doc-ref">${doc.numero || ''}</div>
        <div class="doc-dates">
          <span class="label">Émis le</span><span class="val">${doc.date_emission || '—'}</span>
          <span class="label">Valable jusqu'au</span><span class="val">${doc.date_validite || '—'}</span>
          <span class="label">Statut</span><span class="val">${badge(doc.statut)}</span>
        </div>
      </div>
    </div>
    ${partiesBlock(cab, client, 'Émis par', 'Destinataire')}
    <div class="project-block">
      <div class="cell"><div class="lab">Projet</div><div class="val">${doc.projet_nom || '—'}</div></div>
      <div class="cell"><div class="lab">Client</div><div class="val">${doc.client_nom || '—'}</div></div>
      <div class="cell"><div class="lab">Conditions</div><div class="val">${condLabel}</div></div>
    </div>
    ${doc.notes ? `<div class="intro-block">${doc.notes}</div>` : ''}
    <table class="items">
      <thead>
        <tr>
          <th style="width:28px">#</th>
          <th>Désignation</th>
          <th class="r" style="width:60px">Qté</th>
          <th class="r" style="width:110px">P.U. HT</th>
          <th class="r" style="width:50px">TVA</th>
          <th class="r" style="width:110px">Total HT</th>
        </tr>
      </thead>
      <tbody>${lignesRows}</tbody>
    </table>
    ${totalsBlock(doc.montant_ht, null, doc.montant_ttc, paymentHtml, doc.remise, cab.assujetti_tva !== false)}
    ${doc.mentions_legales ? `<div class="legal-mentions">${doc.mentions_legales.replace(/\n/g, '<br>')}</div>` : ''}
    ${sigBlock(cab, client?.contact_nom || client?.nom, 'accord')}
    ${footerBlock(cab)}
    <div class="page-meta">1/1 · ${doc.numero || ''}</div>
  </div>
</div>`
}

function generateFacture(doc, cab, client) {
    const htN = Number(doc.montant_ht) || 0
    const lignes = doc.lignes && doc.lignes.length ? doc.lignes : null
    const condLabel = COND_LABELS[doc.conditions_paiement] || 'À réception de la facture'

    const lignesRows = lignes
        ? lignes.map((l, i) => {
            const totHt = Number(l.quantite || 1) * Number(l.prix_unitaire || 0)
            return `<tr>
          <td class="lineno">${String(i + 1).padStart(2, '0')}</td>
          <td class="desc-cell"><b>${l.designation || ''}</b></td>
          <td class="r">${fmtNum(l.quantite, 2)}</td>
          <td class="r">${fmtNum(l.prix_unitaire, 2)}</td>
          <td class="r">${l.tva || 0}%</td>
          <td class="r">${fmtNum(totHt, 2)}</td>
        </tr>`
          }).join('')
        : `<tr>
          <td class="lineno">01</td>
          <td class="desc-cell">
            <b>${doc.phase ? `Phase — ${doc.phase}` : "Honoraires de maîtrise d'œuvre"}</b>
            ${doc.notes ? `<div class="sub">${doc.notes}</div>` : ''}
          </td>
          <td class="r">1</td>
          <td class="r">${fmtNum(htN, 2)}</td>
          <td class="r">19%</td>
          <td class="r">${fmtNum(htN, 2)}</td>
        </tr>`

    const paymentHtml = `Règlement : <b>${condLabel}</b>
        ${doc.rib ? `<br><br><b>Coordonnées bancaires</b><br><span style="font-family:'Geist Mono',monospace;font-size:11px">${doc.rib.replace(/\n/g, '<br>')}</span>` : ''}`

    const legalHtml = doc.mentions_legales
        ? `<div class="legal-mentions">${doc.mentions_legales.replace(/\n/g, '<br>')}</div>`
        : `<div class="legal-mentions"><b>Mentions légales —</b> Facture établie conformément à la Loi de Finances en vigueur. En cas de litige, tribunal compétent d'Alger.</div>`

    return `
<div class="doc-paper">
  ${doc.statut === 'BROUILLON' ? '<div class="doc-watermark">BROUILLON</div>' : ''}
  ${doc.statut === 'SOLDEE' ? '<div class="doc-watermark" style="color:rgba(16,185,129,0.07)">PAYÉE</div>' : ''}
  <div class="doc-pad">
    <div class="doc-head">
      ${issuerBlock(cab)}
      <div class="doc-type-block">
        <div class="doc-type-label">Facture</div>
        <div class="doc-type-name">${doc.numero || ''}</div>
        <div class="doc-ref">${doc.numero || ''}</div>
        <div class="doc-dates">
          <span class="label">Date</span><span class="val">${doc.date_emission || '—'}</span>
          <span class="label">Échéance</span><span class="val">${doc.date_echeance || '—'}</span>
          <span class="label">Statut</span><span class="val">${badge(doc.statut)}</span>
        </div>
      </div>
    </div>
    ${partiesBlock(cab, client, 'Facturé par', 'Facturé à')}
    <div class="project-block">
      <div class="cell"><div class="lab">Projet</div><div class="val">${doc.projet_nom || '—'}</div></div>
      <div class="cell"><div class="lab">Phase</div><div class="val">${doc.phase || '—'}</div></div>
      <div class="cell"><div class="lab">Règlement</div><div class="val">${condLabel}</div></div>
    </div>
    <table class="items">
      <thead>
        <tr>
          <th style="width:28px">#</th>
          <th>Désignation</th>
          <th class="r" style="width:60px">Qté</th>
          <th class="r" style="width:110px">P.U. HT</th>
          <th class="r" style="width:50px">TVA</th>
          <th class="r" style="width:110px">Total HT</th>
        </tr>
      </thead>
      <tbody>${lignesRows}</tbody>
    </table>
    ${totalsBlock(doc.montant_ht, null, doc.montant_ttc, paymentHtml, doc.remise, cab.assujetti_tva !== false)}
    ${legalHtml}
    ${footerBlock(cab)}
    <div class="page-meta">1/1 · ${doc.numero || ''}</div>
  </div>
</div>`
}

function generateContrat(doc, cab, client) {
    const missions = Array.isArray(doc.missions) ? doc.missions : []
    const missionLabels = {
        ESQ: 'Esquisse (ESQ)',  APS: 'Avant-Projet Sommaire (APS)', APD: 'Avant-Projet Détaillé (APD)',
        PC: 'Permis de Construire (PC)', DCE: 'Dossier Consultation Entreprises (DCE)',
        APM: 'Assistance Passation Marchés (APM)', DET: 'Direction Exécution Travaux (DET)', AOR: 'Assistance Opérations Réception (AOR)',
    }
    const ttcN = Number(doc.montant_ttc) || 0
    const htN = Number(doc.montant_ht) || 0
    const isAvenant = doc.type === 'AVENANT'
    const title = isAvenant ? `Avenant n° ${doc.numero}` : "Contrat d'études et de Maîtrise d'œuvre"
    const subtitle = `Projet : ${doc.projet_nom || ''}`

    return `
<div class="doc-paper">
  ${doc.statut === 'BROUILLON' ? '<div class="doc-watermark">BROUILLON</div>' : ''}
  <div class="doc-pad">
    <div class="doc-head">
      ${issuerBlock(cab)}
      <div class="doc-type-block">
        <div class="doc-type-label">${isAvenant ? 'Avenant' : 'Contrat de Maîtrise d\'œuvre'}</div>
        <div class="doc-type-name" style="font-size:26px">${doc.numero || ''}</div>
        <div class="doc-ref">${doc.numero || ''}</div>
        <div class="doc-dates">
          <span class="label">Signé le</span><span class="val">${doc.date_signature || '—'}</span>
          <span class="label">Durée</span><span class="val">${doc.date_debut || '—'} → ${doc.date_fin || '—'}</span>
          <span class="label">Statut</span><span class="val">${badge(doc.statut)}</span>
        </div>
      </div>
    </div>
    <div class="contract-body">
      <h1 class="contract-h1">${title}</h1>
      <div class="contract-sub">${subtitle}</div>
      ${partiesBlock(cab, client, "Entre — Le Maître d'œuvre", "Et — Le Maître d'ouvrage")}
      <div style="margin-top:24px">
        ${doc.articles && doc.articles.length
            ? renderDynamicArticles(doc.articles, isAvenant ? { htN, ttcN, date_debut: doc.date_debut, date_fin: doc.date_fin } : null)
            : (isAvenant ? generateAvenantArticles(doc, htN, ttcN) : generateContratArticles(doc, missions, missionLabels, htN, ttcN))
        }
      </div>
      ${sigBlock(cab, client?.contact_nom || client?.nom, 'contrat')}
    </div>
    ${footerBlock(cab)}
    <div class="page-meta">1/— · ${doc.numero || ''}</div>
  </div>
</div>`
}

function renderDynamicArticles(articles, aven = null) {
    return articles.map((art, i) => {
        const isHonoraires = aven && /honoraire/i.test(art.titre)
        const isDuree = aven && /dur.e/i.test(art.titre)
        let body = art.contenu ? `<p>${art.contenu.replace(/\n/g, '<br>')}</p>` : ''
        if (isHonoraires && !art.contenu && aven.ttcN > 0) {
            body = `
  <div class="highlight" style="text-align:center;padding:16px 14px">
    <div style="font-size:11px;color:#6B6862;text-transform:uppercase;letter-spacing:0.08em">Montant TTC</div>
    <div style="font-size:28px;font-weight:700;font-family:'Geist Mono',monospace;margin-top:4px">${fmtDA(aven.ttcN)}</div>
    <div style="font-size:11px;color:#6B6862;margin-top:6px;font-style:italic">${numberToFrenchWords(Math.round(aven.ttcN))} dinars algériens, TVA 19% incluse.</div>
  </div>`
        } else if (isHonoraires && aven.ttcN > 0) {
            body += `
  <div class="highlight" style="text-align:center;padding:16px 14px;margin-top:10px">
    <div style="font-size:11px;color:#6B6862;text-transform:uppercase;letter-spacing:0.08em">Montant TTC</div>
    <div style="font-size:28px;font-weight:700;font-family:'Geist Mono',monospace;margin-top:4px">${fmtDA(aven.ttcN)}</div>
    <div style="font-size:11px;color:#6B6862;margin-top:6px;font-style:italic">${numberToFrenchWords(Math.round(aven.ttcN))} dinars algériens, TVA 19% incluse.</div>
  </div>`
        }
        if (isDuree && !art.contenu) {
            body = `<p>Le présent avenant prend effet à compter du ${aven.date_debut || '—'} jusqu'au ${aven.date_fin || '—'}, sauf prolongation convenue entre les parties.</p>`
        }
        return `
<article class="article">
  <h3><span class="art-num">${String(i + 1).padStart(2, '0')}</span> ${art.titre || ''}</h3>
  ${body}
</article>`
    }).join('')
}

function generateContratArticles(doc, missions, missionLabels, htN, ttcN) {
    return `
<article class="article">
  <h3><span class="art-num">Art. 01</span> Objet du contrat</h3>
  <p>${doc.objet || `Le présent contrat a pour objet de définir les conditions dans lesquelles le Maître d'œuvre est chargé par le Maître d'ouvrage de la réalisation des études d'architecture et du suivi d'exécution du projet <b>${doc.projet_nom || ''}</b>.`}</p>
</article>
<article class="article">
  <h3><span class="art-num">Art. 02</span> Étendue de la mission</h3>
  <p>La mission comprend les phases suivantes :</p>
  <ul>${missions.length ? missions.map(m => `<li><b>${missionLabels[m] || m}</b></li>`).join('') : '<li>Mission complète — à préciser par avenant.</li>'}</ul>
</article>
<article class="article">
  <h3><span class="art-num">Art. 03</span> Honoraires</h3>
  <p>En contrepartie de sa mission, le Maître d'œuvre percevra des honoraires d'un montant total de :</p>
  <div class="highlight">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span><b>Montant HT :</b> ${fmtDA(htN)}</span>
      <span><b>Total TTC :</b> <span style="font-size:16px;font-weight:700">${fmtDA(ttcN)}</span></span>
    </div>
    <div style="margin-top:4px;font-size:11px;color:#6B6862">Soit <b>${numberToFrenchWords(Math.round(ttcN))} dinars algériens</b>, TVA 19% incluse.</div>
  </div>
</article>
<article class="article">
  <h3><span class="art-num">Art. 04</span> Modalités de paiement</h3>
  <ul>
    <li><b>30%</b> à la signature — ${fmtDA(ttcN * 0.30)}</li>
    <li><b>20%</b> à la validation de l'APS — ${fmtDA(ttcN * 0.20)}</li>
    <li><b>25%</b> à la remise de l'APD et du permis — ${fmtDA(ttcN * 0.25)}</li>
    <li><b>15%</b> à la remise du DCE — ${fmtDA(ttcN * 0.15)}</li>
    <li><b>10%</b> à la réception définitive — ${fmtDA(ttcN * 0.10)}</li>
  </ul>
</article>
<article class="article">
  <h3><span class="art-num">Art. 05</span> Durée &amp; délais</h3>
  <p>Le contrat prend effet à compter de sa signature${doc.date_debut ? ` le <b>${doc.date_debut}</b>` : ''} jusqu'au ${doc.date_fin ? `<b>${doc.date_fin}</b>` : 'terme convenu'}, sauf prolongation par avenant.</p>
</article>
<article class="article">
  <h3><span class="art-num">Art. 06</span> Obligations des parties</h3>
  <p>Le Maître d'ouvrage s'engage à fournir les documents nécessaires et à régler les honoraires conformément à l'article 04. Le Maître d'œuvre s'engage à exécuter sa mission avec diligence, dans le respect des règles de l'art et des dispositions légales en vigueur en Algérie.</p>
</article>
<article class="article">
  <h3><span class="art-num">Art. 07</span> Assurance &amp; responsabilité</h3>
  <p>Le Maître d'œuvre déclare avoir souscrit une assurance professionnelle (Garantie Décennale et Responsabilité Civile) couvrant les risques liés à l'exercice de sa mission.</p>
</article>
<article class="article">
  <h3><span class="art-num">Art. 08</span> Résiliation</h3>
  <p>En cas de manquement grave, le contrat pourra être résilié de plein droit, après mise en demeure restée sans effet pendant <b>30 jours</b>. Les honoraires des phases déjà réalisées restent acquis au Maître d'œuvre.</p>
</article>
<article class="article">
  <h3><span class="art-num">Art. 09</span> Litiges &amp; juridiction compétente</h3>
  <p>Tout différend sera, à défaut de règlement amiable, porté devant le <b>Tribunal d'Alger</b>, seul compétent. Le contrat est soumis au droit algérien.</p>
  ${doc.notes ? `<p><i>${doc.notes}</i></p>` : ''}
</article>`
}

function generateAvenantArticles(doc, htN, ttcN) {
    return `
<article class="article">
  <h3><span class="art-num">Art. 01</span> Objet</h3>
  <p>${doc.objet || `Le présent avenant porte sur le projet <b>« ${doc.projet_nom || ''} »</b> et définit les conditions complémentaires convenues entre les parties.`}</p>
  ${doc.notes ? `<p>${doc.notes}</p>` : ''}
</article>
<article class="article">
  <h3><span class="art-num">Art. 02</span> Honoraires</h3>
  <div class="highlight" style="text-align:center;padding:16px 14px">
    <div style="font-size:11px;color:#6B6862;text-transform:uppercase;letter-spacing:0.08em">Montant TTC</div>
    <div style="font-size:28px;font-weight:700;font-family:'Geist Mono',monospace;margin-top:4px">${fmtDA(ttcN)}</div>
    <div style="font-size:11px;color:#6B6862;margin-top:6px;font-style:italic">${numberToFrenchWords(Math.round(ttcN))} dinars algériens, TVA 19% incluse.</div>
  </div>
</article>
<article class="article">
  <h3><span class="art-num">Art. 03</span> Durée</h3>
  <p>Le présent avenant prend effet à compter du ${doc.date_debut || '—'} jusqu'au ${doc.date_fin || '—'}, sauf prolongation convenue entre les parties.</p>
</article>`
}

function generateRapport(doc, cab) {
    const METEO_LABELS = { SOLEIL: 'Ensoleillé', NUAGEUX: 'Nuageux', PLUIE: 'Pluie', VENT: 'Vent' }
    const ETAT_LABELS  = { BON: 'Bon', ACCEPTABLE: 'Acceptable', MAUVAIS: 'Mauvais', CRITIQUE: 'Critique' }
    const ETAT_COLORS  = { BON: '#059669', ACCEPTABLE: '#D97706', MAUVAIS: '#DC2626', CRITIQUE: '#7F1D1D' }
    const etatColor = ETAT_COLORS[doc.etat_general] || '#059669'
    const etatLabel = ETAT_LABELS[doc.etat_general] || doc.etat_general

    const points = Array.isArray(doc.points_controle) ? doc.points_controle : []
    const pointsHtml = points.length ? points.map(p => {
        const ok = p.statut === 'OK', na = p.statut === 'NA'
        const col = ok ? '#059669' : na ? '#64748B' : '#DC2626'
        const icon = ok ? '✓' : na ? '—' : '✗'
        const bg  = ok ? '#ECFDF5' : na ? '#F8FAFC' : '#FEF2F2'
        const brd = ok ? '#A7F3D0' : na ? '#E2E8F0' : '#FECACA'
        return `<div class="check-row" style="background:${bg};border-color:${brd}">
  <span class="check-icon" style="color:${col}">${icon}</span>
  <span class="check-label">${p.label || ''}</span>
  <span class="check-badge" style="background:${bg};color:${col}">${p.statut}</span>
</div>`
    }).join('') : ''

    return `
<div class="doc-paper">
  <div class="doc-pad">
    <div class="doc-head">
      ${issuerBlock(cab)}
      <div class="doc-type-block">
        <div class="doc-type-label">Rapport de terrain</div>
        <div class="doc-type-name" style="font-size:22px;line-height:1.2">${doc.titre || ''}</div>
        <div class="doc-dates">
          <span class="label">Date</span><span class="val">${doc.date || '—'}</span>
          <span class="label">Projet</span><span class="val">${doc.projet_nom || '—'}</span>
          <span class="label">Rédigé par</span><span class="val">${doc.redacteur_nom || '—'}</span>
          <span class="label">État général</span><span class="val" style="font-weight:700;color:${etatColor}">${etatLabel}</span>
        </div>
      </div>
    </div>
    <div class="project-block">
      <div class="cell"><div class="lab">Lieu</div><div class="val">${doc.lieu || '—'}</div></div>
      <div class="cell"><div class="lab">Météo</div><div class="val">${METEO_LABELS[doc.meteo] || doc.meteo || '—'}</div></div>
      <div class="cell"><div class="lab">État général</div><div class="val" style="font-weight:700;color:${etatColor}">${etatLabel}</div></div>
    </div>
    ${points.length ? `
    <div class="rapport-section">
      <div class="rapport-section-title">Points de contrôle</div>
      <div class="checks-grid">${pointsHtml}</div>
    </div>` : ''}
    ${doc.observations ? `
    <div class="rapport-section">
      <div class="rapport-section-title">Observations</div>
      <div class="rapport-text">${doc.observations.replace(/\n/g, '<br>')}</div>
    </div>` : ''}
    ${doc.actions_requises ? `
    <div class="rapport-section">
      <div class="rapport-section-title" style="color:#92400E">Actions requises</div>
      <div class="rapport-text" style="background:#FFFBEB;border-color:#FDE68A;color:#92400E">${doc.actions_requises.replace(/\n/g, '<br>')}</div>
    </div>` : ''}
    <div class="signature-row" style="margin-top:32px">
      <div class="sig-box">
        <div class="sig-label">Rédigé par</div>
        <div class="sig-name">${doc.redacteur_nom || ''}</div>
        <div class="sig-hint">Signature et date</div>
      </div>
      <div class="sig-box">
        <div class="sig-label">Visa du responsable</div>
        <div class="sig-name">${cab.nom || ''}</div>
        <div class="sig-hint">Signature et cachet</div>
      </div>
    </div>
    ${footerBlock(cab)}
    <div class="page-meta">Rapport · ${doc.date || ''}</div>
  </div>
</div>`
}

// ── CSS ──────────────────────────────────────────────────────────────────────

const DOC_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap');
:root{--bg:#FAFAF7;--bg-2:#F4F2EC;--ink:#111110;--ink-2:#2A2926;--muted:#6B6862;--muted-2:#9A968D;--line:#E8E6E0;--line-2:#D6D3CB;--accent:oklch(0.55 0.16 252);--accent-soft:oklch(0.95 0.04 252)}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#ECEAE3;font-family:"Geist","Inter",system-ui,sans-serif;font-size:13px;color:#111110;-webkit-font-smoothing:antialiased}
.print-stage{display:flex;flex-direction:column;align-items:center;gap:32px;padding:32px 0}
.doc-paper{background:#fff;width:210mm;min-height:297mm;max-width:210mm;margin:0 auto;box-shadow:0 1px 2px rgba(0,0,0,.04),0 12px 32px rgba(0,0,0,.10);position:relative;color:#0F0E0C;font-size:13px;line-height:1.5}
.doc-watermark{position:absolute;top:30%;left:50%;transform:translate(-50%,-50%) rotate(-18deg);font-size:110px;font-weight:700;color:rgba(0,0,0,.04);letter-spacing:.1em;pointer-events:none;user-select:none}
.doc-pad{padding:11mm 16mm 14mm}
.doc-head{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:start;padding-bottom:18px;border-bottom:1px solid var(--line)}
.doc-issuer-row{display:flex;gap:16px;align-items:flex-start}
.logo-img{width:56px;height:56px;object-fit:contain;flex-shrink:0}
.logo-slot{width:56px;height:56px;background:var(--ink);position:relative;flex-shrink:0}
.logo-slot::before,.logo-slot::after{content:"";position:absolute;background:#fff}
.logo-slot::before{inset:12px 0 0 12px;width:32px;height:1px}
.logo-slot::after{inset:12px 0 0 12px;width:1px;height:32px}
.issuer-info{font-size:12px;line-height:1.55}
.issuer-info b{display:block;font-size:15px;margin-bottom:4px;color:var(--ink);letter-spacing:-.01em;font-weight:600}
.issuer-info .meta{margin-top:6px;display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-family:"Geist Mono",monospace;font-size:11px;color:var(--muted)}
.issuer-info .meta span:nth-child(odd){color:var(--muted-2)}
.doc-type-block{text-align:right;min-width:220px}
.doc-type-label{font-size:10px;text-transform:uppercase;letter-spacing:.16em;color:var(--muted);font-weight:500}
.doc-type-name{font-size:30px;font-weight:700;letter-spacing:-.03em;margin:4px 0 8px;line-height:1;font-family:"Geist Mono",monospace}
.doc-ref{font-family:"Geist Mono",monospace;font-size:12px;color:var(--ink-2)}
.doc-dates{margin-top:12px;display:grid;grid-template-columns:auto auto;gap:4px 16px;font-size:11px;font-family:"Geist Mono",monospace;justify-content:end}
.doc-dates .label{color:var(--muted-2);text-transform:uppercase;letter-spacing:.06em;font-size:10px}
.doc-dates .val{color:var(--ink);text-align:right}
.doc-parties{display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:16px 0;border-bottom:1px solid var(--line)}
.party-label{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--accent);font-weight:600;margin-bottom:8px;display:flex;align-items:center;gap:6px}
.party-label::before{content:"";width:16px;height:1px;background:var(--accent)}
.party-name{font-size:15px;font-weight:600;letter-spacing:-.01em;margin-bottom:4px}
.party-detail{font-size:12px;color:var(--ink-2)}
.party-detail .small{color:var(--muted);font-size:11px;margin-top:6px;font-family:"Geist Mono",monospace}
.project-block{padding:12px 0;border-bottom:1px solid var(--line);display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.project-block .cell .lab{font-size:10px;color:var(--muted-2);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
.project-block .cell .val{font-size:13px;font-weight:500}
.intro-block{margin-top:14px;padding:10px 14px;background:var(--accent-soft);border-radius:4px;font-size:12px;line-height:1.55}
table.items{width:100%;border-collapse:collapse;margin-top:24px}
table.items thead th{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:600;text-align:left;padding:10px 8px;border-bottom:1.5px solid var(--ink)}
table.items thead th.r{text-align:right}
table.items tbody td{padding:14px 8px;border-bottom:1px solid var(--line);vertical-align:top;font-size:12.5px}
table.items tbody td.r{text-align:right;font-family:"Geist Mono",monospace;white-space:nowrap}
table.items tbody .lineno{color:var(--muted-2);font-family:"Geist Mono",monospace;font-size:11px;width:28px}
table.items tbody .desc-cell b{display:block;font-weight:600;margin-bottom:2px;color:var(--ink)}
table.items tbody .desc-cell .sub{color:var(--muted);font-size:11px}
.doc-totals{display:grid;grid-template-columns:1fr 300px;gap:24px;margin-top:16px;padding-top:12px;break-inside:avoid;page-break-inside:avoid}
.payment-info{font-size:11px;color:var(--muted);line-height:1.6}
.payment-info b{color:var(--ink)}
.payment-grid{background:var(--bg-2);padding:12px;border-radius:4px;font-family:"Geist Mono",monospace;display:grid;grid-template-columns:auto 1fr;gap:4px 14px;margin-top:8px}
.payment-grid span:nth-child(odd){color:var(--muted-2);font-size:10px;text-transform:uppercase;letter-spacing:.06em}
.payment-grid span:nth-child(even){color:var(--ink);font-size:11px}
.totals-card{font-family:"Geist Mono",monospace}
.totals-card .row{display:flex;justify-content:space-between;padding:6px 0;font-size:12px;border-bottom:1px dashed var(--line)}
.totals-card .row .lab{color:var(--muted)}
.totals-card .row .val{font-weight:500}
.totals-card .row.grand{margin-top:8px;padding:12px 14px;background:var(--ink);color:#fff;font-size:15px;font-weight:600;border-radius:4px;border:none}
.totals-card .row.grand .lab{color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.08em;font-size:10px}
.totals-card .row.grand .val{font-size:18px;letter-spacing:-.01em}
.amount-in-words{margin-top:12px;font-size:11px;color:var(--muted);font-style:italic;padding-top:12px;border-top:1px solid var(--line)}
.amount-in-words b{color:var(--ink);font-style:normal}
.signature-row{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:28px;padding-top:20px;border-top:1px solid var(--line);break-inside:avoid;page-break-inside:avoid}
.sig-box{border:1px dashed var(--line-2);border-radius:4px;padding:12px;min-height:96px;position:relative;break-inside:avoid;page-break-inside:avoid}
.sig-label{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);font-weight:600}
.sig-name{font-size:12px;margin-top:4px;color:var(--ink-2)}
.sig-hint{font-size:10px;color:var(--muted-2);margin-top:8px;font-style:italic}
.contract-body{padding-top:18px}
.contract-h1{font-size:22px;font-weight:700;letter-spacing:-.02em;text-align:center;margin:0 0 4px}
.contract-sub{text-align:center;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:20px}
.article{margin-bottom:14px;break-inside:avoid;page-break-inside:avoid}
.article h3{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--accent);font-weight:600;margin:0 0 6px;display:flex;align-items:center;gap:10px}
.article h3 .art-num{font-family:"Geist Mono",monospace;background:var(--ink);color:#fff;padding:2px 7px;border-radius:3px;font-size:10px}
.article p{margin:0 0 6px;font-size:12px;color:var(--ink-2);line-height:1.6;text-align:justify}
.article ul{margin:6px 0;padding-left:18px;font-size:12px;color:var(--ink-2)}
.article ul li{margin-bottom:3px;line-height:1.55}
.article .highlight{background:var(--accent-soft);padding:12px 14px;border-left:2px solid var(--accent);border-radius:0 4px 4px 0;margin:10px 0;font-size:12.5px}
.diff-block{border:1px solid var(--line);border-radius:4px;overflow:hidden;margin:12px 0}
.diff-row{display:grid;grid-template-columns:110px 1fr 1fr;font-size:12px}
.diff-row+.diff-row{border-top:1px solid var(--line)}
.diff-row.head{background:var(--bg-2);font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
.diff-row>div{padding:10px 12px}
.diff-row .lab{color:var(--muted);border-right:1px solid var(--line)}
.diff-row .old{color:var(--muted);text-decoration:line-through;border-right:1px solid var(--line)}
.diff-row .new{color:var(--ink);font-weight:500}
.doc-footer{margin-top:20px;padding-top:12px;border-top:1px solid var(--line);font-size:10px;color:var(--muted);display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;font-family:"Geist Mono",monospace;line-height:1.5;break-inside:avoid;page-break-inside:avoid}
.doc-footer b{color:var(--ink-2);font-weight:600}
.doc-footer .center{text-align:center}
.doc-footer .right{text-align:right}
.page-meta{position:absolute;bottom:12px;right:18mm;font-size:9px;color:var(--muted-2);font-family:"Geist Mono",monospace;letter-spacing:.06em}
.legal-mentions{margin-top:24px;padding:12px 14px;border:1px solid var(--line);border-radius:4px;font-size:11px;color:var(--muted);line-height:1.6}
.legal-mentions b{color:var(--ink)}
.badge-status{display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;letter-spacing:.02em}
.badge-status.draft{background:#EFEDE6;color:#6B6862}
.badge-status.sent{background:oklch(0.95 0.05 252);color:oklch(0.45 0.14 252)}
.badge-status.paid,.badge-status.accepted{background:oklch(0.95 0.05 155);color:oklch(0.45 0.14 155)}
.badge-status.signed{background:oklch(0.95 0.05 290);color:oklch(0.45 0.14 290)}
.badge-status.partial{background:oklch(0.95 0.06 70);color:oklch(0.5 0.16 50)}
.badge-status.cancelled{background:#FEF2F2;color:#EF4444}
.rapport-section{margin-top:18px}
.rapport-section-title{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);font-weight:600;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid var(--line)}
.checks-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.check-row{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:4px;border:1px solid var(--line);font-size:12px}
.check-icon{font-weight:700;font-size:14px;flex-shrink:0;width:16px;text-align:center}
.check-label{flex:1;color:var(--ink-2)}
.check-badge{font-size:10px;font-weight:700;padding:2px 7px;border-radius:3px;font-family:"Geist Mono",monospace}
.rapport-text{padding:12px 14px;border-radius:4px;background:var(--bg);border:1px solid var(--line);font-size:12px;color:var(--ink-2);line-height:1.6}
@media print{
  @page{size:A4 portrait;margin:0}
  html,body{background:#fff;margin:0;padding:0}
  .print-stage{padding:0;gap:0}
  .doc-paper{box-shadow:none;margin:0;page-break-after:always;break-after:page;width:100%;max-width:100%}
  .doc-paper:last-child{page-break-after:auto;break-after:auto}
  .signature-row,.sig-box,.doc-totals,.doc-footer,.article{break-inside:avoid;page-break-inside:avoid}
  -webkit-print-color-adjust:exact;print-color-adjust:exact
}
`

// ── Main exports ──────────────────────────────────────────────────────────────

function buildHTML(bodyContent, doc, cab) {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${doc.numero || ''} — ${cab.nom || ''}</title>
<style>${DOC_CSS}</style>
</head>
<body>
<div class="print-stage">${bodyContent}</div>
</body>
</html>`
}

/**
 * Returns a complete HTML string for the document (no auto-print).
 * Used by DocPreviewModal to render in an iframe.
 */
export function getDocHTML(type, doc, cab, client = null) {
    let bodyContent = ''
    if (type === 'devis')         bodyContent = generateDevis(doc, cab, client)
    else if (type === 'facture')  bodyContent = generateFacture(doc, cab, client)
    else if (type === 'rapport')  bodyContent = generateRapport(doc, cab)
    else                          bodyContent = generateContrat(doc, cab, client)
    return buildHTML(bodyContent, doc, cab)
}

/**
 * Same as getDocHTML but pre-fetches the cabinet logo as base64 so it renders
 * correctly inside iframes and blob windows (avoids cross-origin img failures).
 */
export async function getDocHTMLAsync(type, doc, cab, client = null) {
    const logoSrc = await fetchLogoBase64(cab.logo)
    const cabWithLogo = { ...cab, _logoSrc: logoSrc }
    let bodyContent = ''
    if (type === 'devis')         bodyContent = generateDevis(doc, cabWithLogo, client)
    else if (type === 'facture')  bodyContent = generateFacture(doc, cabWithLogo, client)
    else if (type === 'rapport')  bodyContent = generateRapport(doc, cabWithLogo)
    else                          bodyContent = generateContrat(doc, cabWithLogo, client)
    return buildHTML(bodyContent, doc, cab)
}

/**
 * Opens the document in a new browser tab (no auto-print).
 * window.open must be called synchronously (before any await) to avoid popup blockers.
 */
export async function openDocInTab(type, doc, cab, client = null) {
    const w = window.open('', '_blank')
    if (!w) { alert('Autorisez les popups pour ouvrir le document.'); return }
    const html = await getDocHTMLAsync(type, doc, cab, client)
    w.document.write(html)
    w.document.close()
}

/**
 * Opens the document in a new tab and auto-triggers print/save-as-PDF.
 * window.open must be called synchronously (before any await) to avoid popup blockers.
 */
export async function printDoc(type, doc, cab, client = null) {
    const w = window.open('', '_blank')
    if (!w) { alert('Autorisez les popups pour générer le PDF.'); return }
    const html = await getDocHTMLAsync(type, doc, cab, client)
    w.document.write(html)
    w.document.close()
    setTimeout(() => w.print(), 800)
}
