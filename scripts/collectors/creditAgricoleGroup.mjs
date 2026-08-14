// ========================================
// CREDIT AGRICOLE GROUP COLLECTOR
// Crédit Agricole S.A. + CIB + LCL + Amundi
// ========================================

const BASE_URL =
  'https://groupecreditagricole.jobs'

const LIST_BASE =
  `${BASE_URL}/fr/nos-offres/contrats/1292`

const MAX_PAGES = 6

const ENTREPRISES_CIBLES = [
  'Crédit Agricole S.A.',
  'Crédit Agricole CIB',
  'LCL',
  'Amundi',
]


// ========================================
// OUTILS
// ========================================

function normaliser(texte = '') {

  return String(texte)
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
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


// ========================================
// DATE
// ========================================

function convertirDate(date = '') {

  const match =
    date.match(
      /(\d{2})\/(\d{2})\/(\d{4})/
    )

  if (!match) {
    return ''
  }

  return (
    `${match[3]}-` +
    `${match[2]}-` +
    `${match[1]}`
  )

}


function estTropAncienne(
  date,
  joursMaximum = 300
) {

  if (!date) {
    return false
  }

  const publication =
    new Date(date)

  if (
    Number.isNaN(
      publication.getTime()
    )
  ) {
    return false
  }

  const maintenant =
    new Date()

  const difference =
    maintenant.getTime() -
    publication.getTime()

  const jours =
    difference /
    (
      1000 *
      60 *
      60 *
      24
    )

  return jours >
    joursMaximum

}


// ========================================
// HTTP
// ========================================

async function chargerHTML(url) {

  try {

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

      console.log(
        `   HTTP ${response.status} : ${url}`
      )

      return null

    }


    return await response.text()

  } catch (error) {

    console.error(
      `   Erreur HTTP : ${url}`,
      error
    )

    return null

  }

}


// ========================================
// ENTREPRISE
// ========================================

function trouverEntreprise(
  morceauHTML
) {

  const texte =
    normaliser(
      retirerHTML(
        morceauHTML
      )
    )


  if (
    texte.includes(
      'credit agricole cib'
    )
  ) {
    return 'Crédit Agricole CIB'
  }


  if (
    texte.includes(
      'credit agricole s.a'
    ) ||
    texte.includes(
      'credit agricole s.a.'
    )
  ) {
    return 'Crédit Agricole S.A.'
  }


  if (
    texte.includes(
      'amundi'
    )
  ) {
    return 'Amundi'
  }


  if (
    /\blcl\b/.test(
      texte
    )
  ) {
    return 'LCL'
  }


  return null

}


// ========================================
// EXTRAIRE LES OFFRES DE LA LISTE
// ========================================

function extraireCandidats(
  html
) {

  const regex =
    /<a[^>]+href=["']([^"']*\/fr\/nos-offres-emploi\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi


  const correspondances = []

  let match


  while (
    (
      match =
        regex.exec(html)
    ) !== null
  ) {

    correspondances.push({
      index:
        match.index,

      url:
        match[1],

      titre:
        retirerHTML(
          match[2]
        ),
    })

  }


  const resultats = []


  for (
    let i = 0;
    i <
      correspondances.length;
    i++
  ) {

    const offre =
      correspondances[i]


    const debut =
      offre.index


    const fin =
      i + 1 <
      correspondances.length

        ? correspondances[
            i + 1
          ].index

        : Math.min(
            html.length,
            debut + 4000
          )


    const morceau =
      html.slice(
        debut,
        fin
      )


    const entreprise =
      trouverEntreprise(
        morceau
      )


    if (
      !entreprise ||
      !ENTREPRISES_CIBLES.includes(
        entreprise
      )
    ) {
      continue
    }


    let url =
      offre.url


    if (
      url.startsWith('/')
    ) {

      url =
        `${BASE_URL}${url}`

    }


    resultats.push({
      url,
      titre:
        offre.titre,
      entreprise,
    })

  }


  return resultats

}


// ========================================
// TITRE POTENTIELLEMENT PERTINENT
// ========================================

function titrePertinent(
  titre
) {

  const texte =
    normaliser(titre)


  const mots = [

    'business analyst',

    'data',
    'reporting',

    'business intelligence',

    'chef de projet',
    'charge de projet',
    'projet',

    'product owner',
    'product',

    'amoa',
    'moa',

    'pmo',

    'transformation',

    'digital',

    'systeme',

    'informatique',

    'pilotage',

    'organisation',

    'process',

    'quality',

    'qualite',

    'gouvernance',

    'analyste',

  ]


  return mots.some(
    (mot) =>
      texte.includes(mot)
  )

}


// ========================================
// PERTINENCE DU CONTENU
// ========================================

function estPertinent(
  texteBrut
) {

  const texte =
    normaliser(
      texteBrut
    )


  const mots = [

    'business analyst',

    'data analyst',

    'business intelligence',

    'power bi',

    'data management',

    'data quality',

    'gouvernance des donnees',

    'amoa',

    'maitrise d ouvrage',

    'pmo',

    'product owner',

    'chef de projet',

    'charge de projet',

    'gestion de projet',

    'transformation',

    'systeme d information',

    'systemes d information',

    'reporting',

    'pilotage',

    'organisation',

    'analyse des processus',

    'amelioration continue',

    'consultant fonctionnel',

  ]


  return mots.some(
    (mot) =>
      texte.includes(mot)
  )

}


// ========================================
// CATEGORIE
// ========================================

function trouverCategorie(
  texteBrut
) {

  const texte =
    normaliser(
      texteBrut
    )


  if (
    texte.includes(
      'business analyst'
    ) ||
    texte.includes(
      'amoa'
    ) ||
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
      'data management'
    ) ||
    texte.includes(
      'data quality'
    ) ||
    texte.includes(
      'gouvernance des donnees'
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
      'chef de projet'
    ) ||
    texte.includes(
      'charge de projet'
    ) ||
    texte.includes(
      'gestion de projet'
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


  if (
    texte.includes(
      'transformation'
    ) ||
    texte.includes(
      'organisation'
    )
  ) {

    return 'Transformation'

  }


  return 'Autre'

}


// ========================================
// COMPETENCES
// ========================================

function trouverCompetences(
  texteBrut
) {

  const texte =
    normaliser(
      texteBrut
    )


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
    'VBA',
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
// SCORE
// ========================================

function calculerScore(
  texteBrut,
  skills
) {

  const texte =
    normaliser(
      texteBrut
    )


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
      'business intelligence'
    )
  ) {
    score += 18
  }


  if (
    texte.includes(
      'amoa'
    )
  ) {
    score += 20
  }


  if (
    texte.includes(
      'product owner'
    )
  ) {
    score += 15
  }


  if (
    texte.includes(
      'pmo'
    )
  ) {
    score += 10
  }


  if (
    texte.includes(
      'chef de projet'
    )
  ) {
    score += 10
  }


  if (
    texte.includes(
      'transformation'
    )
  ) {
    score += 8
  }


  if (
    skills.includes(
      'SQL'
    )
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
    skills.includes(
      'Excel'
    )
  ) {
    score += 3
  }


  if (
    skills.includes(
      'Agile'
    )
  ) {
    score += 3
  }


  if (
    skills.includes(
      'Python'
    )
  ) {
    score += 3
  }


  return Math.min(
    score,
    98
  )

}


// ========================================
// ANALYSER UNE OFFRE
// ========================================

async function analyserOffre(
  candidat
) {

  const html =
    await chargerHTML(
      candidat.url
    )


  if (!html) {
    return null
  }


  const texte =
    retirerHTML(html)


  const texteNormalise =
    normaliser(texte)


  // Vérifie alternance

  if (
    !texteNormalise.includes(
      'alternance / apprentissage'
    ) &&
    !texteNormalise.includes(
      'contrat en alternance'
    ) &&
    !texteNormalise.includes(
      'contrat d apprentissage'
    )
  ) {

    return null

  }


  if (
    !estPertinent(
      texte
    )
  ) {

    return null

  }


  // TITRE

  const titreMatch =
    html.match(
      /<h1[^>]*>([\s\S]*?)<\/h1>/i
    )


  const title =
    titreMatch
      ? retirerHTML(
          titreMatch[1]
        )
      : candidat.titre


  // LIEU

  const locationMatch =
    texte.match(
      /Lieu\s*:\s*(.+?)\s+(?:Secteur|Numéro de l'offre)/i
    )


  let location =
    locationMatch
      ? locationMatch[1]
          .trim()
      : 'France'


  if (
    !normaliser(
      location
    ).includes(
      'france'
    )
  ) {

    const franceMatch =
      texte.match(
        /([A-Za-zÀ-ÿ0-9 ,.'()\-]+ - France)/i
      )

    if (
      franceMatch
    ) {

      location =
        franceMatch[1]
          .trim()

    }

  }


  // On garde la France

  if (
    !normaliser(
      location
    ).includes(
      'france'
    ) &&
    location !== 'France'
  ) {

    return null

  }


  // REFERENCE

  const referenceMatch =
    texte.match(
      /Numéro de l'offre\s*:\s*([A-Za-z0-9\-]+)/i
    )


  const reference =
    referenceMatch
      ? referenceMatch[1]
      : candidat.url


  // DATE

  const dateMatch =
    texte.match(
      /(?:Publiée|Modifiée|Mis à jour) le\s+(\d{2}\/\d{2}\/\d{4})/i
    )


  const publishedAt =
    dateMatch
      ? convertirDate(
          dateMatch[1]
        )
      : ''


  if (
    estTropAncienne(
      publishedAt
    )
  ) {

    return null

  }


  // COMPETENCES

  const skills =
    trouverCompetences(
      texte
    )


  // REMOTE

  const remote =
    texteNormalise.includes(
      'teletravail'
    ) ||
    texteNormalise.includes(
      'travail hybride'
    )


  return {

    id:
      creerId(
        `CA-${reference}`
      ),

    company:
      candidat.entreprise,

    title,

    location,

    contractType:
      'Alternance',

    publishedAt,

    url:
      candidat.url,

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
      'Crédit Agricole Carrières',

  }

}


// ========================================
// TRAITER PAR PETITS LOTS
// ========================================

async function traiterParLots(
  candidats,
  taille = 5
) {

  const resultats = []


  for (
    let i = 0;
    i <
      candidats.length;
    i += taille
  ) {

    const lot =
      candidats.slice(
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

export async function fetchCreditAgricoleGroupJobs() {

  console.log(
    '🏦 Groupe Crédit Agricole'
  )


  const candidats =
    new Map()


  for (
    let page = 1;
    page <= MAX_PAGES;
    page++
  ) {

    const url =
      page === 1

        ? `${LIST_BASE}/`

        : `${LIST_BASE}/page/${page}/`


    console.log(
      `   Page ${page}`
    )


    const html =
      await chargerHTML(
        url
      )


    if (!html) {
      continue
    }


    const offres =
      extraireCandidats(
        html
      )


    let nouvelles = 0


    offres.forEach(
      (offre) => {

        if (
          !titrePertinent(
            offre.titre
          )
        ) {
          return
        }


        if (
          !candidats.has(
            offre.url
          )
        ) {

          candidats.set(
            offre.url,
            offre
          )

          nouvelles++

        }

      }
    )


    console.log(
      `   ${nouvelles} nouvelles offres candidates`
    )

  }


  console.log(
    `   ${candidats.size} offres à analyser`
  )


  const jobs =
    await traiterParLots(
      [...candidats.values()]
    )


  console.log(
    `   ✅ ${jobs.length} offres Crédit Agricole/LCL/Amundi retenues`
  )


  return jobs

}
