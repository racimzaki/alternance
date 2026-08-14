// ========================================
// BNP PARIBAS COLLECTOR
// ========================================

const BASE_URL =
  'https://group.bnpparibas/emploi-carriere'

const LIST_URL =
  `${BASE_URL}/toutes-offres-emploi/alternance/france`

const MAX_PAGES = 20

// ========================================
// OUTILS
// ========================================

function normaliser(texte = '') {
  return String(texte)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function decodeHtml(texte = '') {
  return String(texte)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&eacute;/g, 'é')
    .replace(/&Eacute;/g, 'É')
    .replace(/&agrave;/g, 'à')
    .replace(/&ccedil;/g, 'ç')
}

function retirerHTML(html = '') {
  return decodeHtml(
    String(html)
      .replace(
        /<script[\s\S]*?<\/script>/gi,
        ' '
      )
      .replace(
        /<style[\s\S]*?<\/style>/gi,
        ' '
      )
      .replace(
        /<[^>]*>/g,
        ' '
      )
      .replace(
        /\s+/g,
        ' '
      )
      .trim()
  )
}

function creerId(texte) {
  let hash = 0

  for (
    let i = 0;
    i < texte.length;
    i++
  ) {
    hash =
      (hash << 5) -
      hash +
      texte.charCodeAt(i)

    hash |= 0
  }

  return Math.abs(hash)
}

function convertirDate(date) {
  if (!date) {
    return ''
  }

  const parties =
    date.split('.')

  if (parties.length !== 3) {
    return date
  }

  return (
    `${parties[2]}-` +
    `${parties[1]}-` +
    `${parties[0]}`
  )
}

// ========================================
// REQUÊTE HTTP
// ========================================

async function chargerHTML(url) {
  const response =
    await fetch(
      url,
      {
        headers: {
          'User-Agent':
            'AlternanceRadar/1.0 portfolio-project',
          Accept:
            'text/html,application/xhtml+xml',
        },
      }
    )

  if (!response.ok) {
    return null
  }

  return await response.text()
}

// ========================================
// LIENS DES OFFRES
// ========================================

function extraireLiens(html) {
  const offres = []

  const regex =
    /<a[^>]+href=["']([^"']*\/emploi-carriere\/offre-emploi\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi

  let match

  while (
    (match = regex.exec(html)) !== null
  ) {
    let url = match[1]

    const titre =
      retirerHTML(match[2])

    if (
      url.startsWith('/')
    ) {
      url =
        `https://group.bnpparibas${url}`
    }

    if (
      !url.startsWith(
        'https://group.bnpparibas'
      )
    ) {
      continue
    }

    offres.push({
      url,
      titre,
    })
  }

  return offres
}

// ========================================
// PRÉ-FILTRE SUR LE TITRE
// ========================================

function titrePotentiellementPertinent(
  titre
) {
  const texte =
    normaliser(titre)

  const mots = [
    'business analyst',
    'data',
    'analyst',
    'power bi',
    'business intelligence',

    'amoa',
    'moa',

    'pmo',

    'chef de projet',
    'charge de projet',
    'projet',

    'product owner',
    'product',

    'transformation',

    'digital',

    'numerique',

    'informatique',

    ' it ',

    'systeme d information',

    'si ',

    'reporting',

    'quality',

    'process',
    'processus',
  ]

  return mots.some(
    (mot) =>
      texte.includes(mot)
  )
}

// ========================================
// CONTENU UTILE D'UNE OFFRE
// ========================================

function extraireZoneOffre(html) {
  const debut =
    html.search(/<h1/i)

  if (debut === -1) {
    return html
  }

  let fin =
    html.search(
      /Ces autres offres vous intéressent-elles/i
    )

  if (
    fin === -1 ||
    fin <= debut
  ) {
    fin =
      html.length
  }

  return html.slice(
    debut,
    fin
  )
}

// ========================================
// MÉTIER PERTINENT
// ========================================

function estPertinent(texteBrut) {
  const texte =
    normaliser(texteBrut)

  const mots = [
    'business analyst',

    'data analyst',
    'data quality',
    'data management',
    'data manager',

    'business intelligence',
    'power bi',

    'amoa',
    'maitrise d ouvrage',

    'pmo',
    'portfolio management',

    'product owner',

    'chef de projet',
    'charge de projet',
    'gestion de projet',

    'transformation digitale',
    'transformation numerique',

    'systeme d information',
    'systemes d information',

    'reporting',

    'pilotage des processus',

    'consultant fonctionnel',
  ]

  return mots.some(
    (mot) =>
      texte.includes(mot)
  )
}

// ========================================
// CATÉGORIE
// ========================================

function trouverCategorie(texteBrut) {
  const texte =
    normaliser(texteBrut)

  if (
    texte.includes(
      'business analyst'
    ) ||
    texte.includes('amoa') ||
    texte.includes(
      'maitrise d ouvrage'
    )
  ) {
    return 'Business Analyst'
  }

  if (
    texte.includes(
      'business intelligence'
    ) ||
    texte.includes(
      'power bi'
    )
  ) {
    return 'BI'
  }

  if (
    texte.includes(
      'data analyst'
    ) ||
    texte.includes(
      'data quality'
    ) ||
    texte.includes(
      'data manager'
    ) ||
    texte.includes(
      'data management'
    )
  ) {
    return 'Data'
  }

  if (
    texte.includes(
      'product owner'
    )
  ) {
    return 'Product'
  }

  if (
    texte.includes('pmo') ||
    texte.includes(
      'portfolio management'
    ) ||
    texte.includes(
      'chef de projet'
    ) ||
    texte.includes(
      'charge de projet'
    )
  ) {
    return 'Project Management'
  }

  if (
    texte.includes(
      'systeme d information'
    ) ||
    texte.includes(
      'systemes d information'
    )
  ) {
    return 'SI'
  }

  return 'Autre'
}

// ========================================
// COMPÉTENCES
// ========================================

function trouverCompetences(
  texteBrut
) {
  const texte =
    normaliser(texteBrut)

  const competences = [
    'SQL',
    'Power BI',
    'Excel',
    'Python',
    'Agile',
    'Jira',
    'BPMN',
    'UML',
    'Scrum',
    'Tableau',
    'SAP',
    'Power Query',
    'DAX',
    'Java',
    'Salesforce',
  ]

  const trouvees =
    competences.filter(
      (competence) =>
        texte.includes(
          normaliser(
            competence
          )
        )
    )

  return trouvees.length
    ? trouvees
    : ['À analyser']
}

// ========================================
// MATCH SCORE
// ========================================

function calculerScore(
  texteBrut,
  skills
) {
  const texte =
    normaliser(texteBrut)

  let score = 50

  if (
    texte.includes(
      'business analyst'
    )
  ) {
    score += 25
  }

  if (
    texte.includes(
      'data analyst'
    )
  ) {
    score += 22
  }

  if (
    texte.includes(
      'data quality'
    )
  ) {
    score += 18
  }

  if (
    texte.includes('amoa')
  ) {
    score += 20
  }

  if (
    texte.includes('pmo')
  ) {
    score += 15
  }

  if (
    texte.includes(
      'chef de projet'
    )
  ) {
    score += 12
  }

  if (
    skills.includes('SQL')
  ) {
    score += 5
  }

  if (
    skills.includes(
      'Power BI'
    )
  ) {
    score += 5
  }

  if (
    skills.includes('Excel')
  ) {
    score += 3
  }

  if (
    skills.includes('Agile')
  ) {
    score += 3
  }

  return Math.min(
    score,
    98
  )
}

// ========================================
// ANALYSER UNE OFFRE BNP
// ========================================

async function analyserOffre(url) {
  const html =
    await chargerHTML(url)

  if (!html) {
    return null
  }

  const zone =
    extraireZoneOffre(html)

  const texte =
    retirerHTML(zone)

  if (
    !estPertinent(texte)
  ) {
    return null
  }

  const titreMatch =
    zone.match(
      /<h1[^>]*>([\s\S]*?)<\/h1>/i
    )

  const title =
    titreMatch
      ? retirerHTML(
          titreMatch[1]
        )
      : 'Alternance BNP Paribas'

  const locationMatch =
    texte.match(
      /Localisation\s+(.+?)\s+Référence/i
    )

  const location =
    locationMatch
      ? locationMatch[1].trim()
      : 'France'

  const referenceMatch =
    texte.match(
      /Référence\s+([^\s]+)/i
    )

  const reference =
    referenceMatch
      ? referenceMatch[1]
      : url

  const dateMatch =
    texte.match(
      /Mise à jour le\s+(\d{2}\.\d{2}\.\d{4})/i
    )

  const publishedAt =
    dateMatch
      ? convertirDate(
          dateMatch[1]
        )
      : ''

  const skills =
    trouverCompetences(
      texte
    )

  const remote =
    normaliser(
      texte
    ).includes(
      'travail hybride'
    ) ||
    normaliser(
      texte
    ).includes(
      'teletravail'
    )

  return {
    id:
      creerId(
        `BNP-${reference}`
      ),

    company:
      'BNP Paribas',

    title,

    location,

    contractType:
      'Alternance',

    publishedAt,

    url,

    category:
      trouverCategorie(
        texte
      ),

    remote,

    skills,

    matchScore:
      calculerScore(
        texte,
        skills
      ),

    status:
      'active',

    source:
      'BNP Paribas Careers',
  }
}

// ========================================
// PETITS GROUPES DE REQUÊTES
// ========================================

async function traiterParLots(
  urls,
  taille = 5
) {
  const resultats = []

  for (
    let i = 0;
    i < urls.length;
    i += taille
  ) {
    const lot =
      urls.slice(
        i,
        i + taille
      )

    const donnees =
      await Promise.all(
        lot.map(
          analyserOffre
        )
      )

    resultats.push(
      ...donnees.filter(Boolean)
    )
  }

  return resultats
}

// ========================================
// EXPORT PRINCIPAL
// ========================================

export async function fetchBnpJobs() {
  console.log(
    '🏦 BNP Paribas'
  )

  const liens =
    new Map()

  for (
    let page = 1;
    page <= MAX_PAGES;
    page++
  ) {
    const url =
      `${LIST_URL}?page=${page}`

    const html =
      await chargerHTML(url)

    if (!html) {
      break
    }

    const offres =
      extraireLiens(html)

    let nouvelles = 0

    offres.forEach(
      (offre) => {

        if (
          !titrePotentiellementPertinent(
            offre.titre
          )
        ) {
          return
        }

        if (
          !liens.has(
            offre.url
          )
        ) {
          liens.set(
            offre.url,
            offre
          )

          nouvelles++
        }
      }
    )

    if (
      offres.length === 0
    ) {
      break
    }

    console.log(
      `   Page ${page}: ${nouvelles} candidates`
    )
  }

  console.log(
    `   ${liens.size} offres à analyser`
  )

  const jobs =
    await traiterParLots(
      [...liens.keys()]
    )

  console.log(
    `   ✅ ${jobs.length} offres BNP retenues`
  )

  return jobs
}
