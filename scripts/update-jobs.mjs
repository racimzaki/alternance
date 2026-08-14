import {
  mkdir,
  writeFile,
} from 'node:fs/promises'

// ========================================
// ENTREPRISES CONNECTÉES
// ========================================

const COMPANIES = [
  {
    identifier: 'BoschGroup',
    label: 'Bosch',
  },
  {
    identifier: 'SopraSteria1',
    label: 'Sopra Steria',
  },
  {
    identifier: 'Talan',
    label: 'Talan',
  },
  {
    identifier: 'inetum2',
    label: 'Inetum',
  },
  {
    identifier: 'Devoteam',
    label: 'Devoteam',
  },
  {
    identifier: 'ALTAREA',
    label: 'Altarea',
  },
  {
    identifier: 'CITECH',
    label: 'CITECH',
  },
  {
    identifier: 'Wavestone1',
    label: 'Wavestone',
  },
  {
    identifier: 'Ubisoft2',
    label: 'Ubisoft',
  },
  {
    identifier: 'Financeactive',
    label: 'Finance Active',
  },
  {
    identifier: 'Sogetrel',
    label: 'Sogetrel',
  },
  {
    identifier: 'ALTEREA',
    label: 'ALTEREA',
  },
  {
    identifier: 'SocieteGenerale4',
    label: 'Société Générale',
  },
  {
    identifier: 'BusinessDecision',
    label: 'Business & Decision',
  },
]

// ========================================
// RECHERCHES ALTERNANCE
// ========================================

const SEARCHES = [
  'alternance',
  'alternant',
  'apprenti',
  'apprentissage',
  'apprenticeship',
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

function retirerHTML(texte = '') {
  return String(texte)
    .replace(
      /<[^>]*>/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
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
// TEXTE COMPLET
// ========================================

function obtenirTexte(job) {
  const sections =
    job.jobAd?.sections

  return retirerHTML(
    [
      job.name,

      job.typeOfEmployment
        ?.label,

      sections
        ?.jobDescription
        ?.text,

      sections
        ?.qualifications
        ?.text,

      sections
        ?.additionalInformation
        ?.text,
    ]
      .filter(Boolean)
      .join(' ')
  )
}

// ========================================
// VÉRIFIER QUE C'EST UNE ALTERNANCE
// ========================================

function estAlternance(job) {
  const texte =
    normaliser(
      [
        job.name,
        job.typeOfEmployment
          ?.label,
        obtenirTexte(job),
      ].join(' ')
    )

  const mots = [
    'alternance',
    'alternant',
    'alternante',
    'apprenti',
    'apprentie',
    'apprentissage',
    'apprenticeship',
    'professionnalisation',
  ]

  return mots.some(
    (mot) =>
      texte.includes(mot)
  )
}

// ========================================
// MÉTIERS QUI NOUS INTÉRESSENT
// ========================================

function estPertinent(job) {
  const texte =
    normaliser(
      obtenirTexte(job)
    )

  const motsCles = [
    'business analyst',
    'data analyst',
    'business intelligence',
    'bi analyst',
    'power bi',

    'amoa',
    'maitrise d ouvrage',
    'maitrise ouvrage',

    'product owner',
    'product management',

    'pmo',
    'project management',

    'chef de projet',
    'gestion de projet',

    'consultant fonctionnel',
    'consultant data',

    'systeme d information',
    'systemes d information',

    'transformation digitale',
    'transformation numerique',

    'data intelligence',
    'analyse de donnees',
    'analyse des donnees',

    'reporting',
    'pilotage',

    'sap',
  ]

  return motsCles.some(
    (mot) =>
      texte.includes(mot)
  )
}

// ========================================
// CATÉGORIE
// ========================================

function trouverCategorie(job) {
  const texte =
    normaliser(
      obtenirTexte(job)
    )

  if (
    texte.includes(
      'business analyst'
    ) ||
    texte.includes('amoa')
  ) {
    return 'Business Analyst'
  }

  if (
    texte.includes(
      'business intelligence'
    ) ||
    texte.includes(
      'bi analyst'
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
      'analyse de donnees'
    ) ||
    texte.includes(
      'analyse des donnees'
    )
  ) {
    return 'Data'
  }

  if (
    texte.includes(
      'product owner'
    ) ||
    texte.includes(
      'product management'
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
    ) ||
    texte.includes(
      'consultant fonctionnel'
    ) ||
    texte.includes('sap')
  ) {
    return 'SI'
  }

  return 'Autre'
}

// ========================================
// COMPÉTENCES
// ========================================

function trouverCompetences(job) {
  const texte =
    normaliser(
      obtenirTexte(job)
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
// SCORE DE PERTINENCE
// ========================================

function calculerScore(
  job,
  skills
) {
  const texte =
    normaliser(
      obtenirTexte(job)
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
    texte.includes('amoa')
  ) {
    score += 20
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
      'product owner'
    )
  ) {
    score += 15
  }

  if (
    texte.includes('pmo')
  ) {
    score += 10
  }

  if (
    texte.includes(
      'consultant fonctionnel'
    )
  ) {
    score += 10
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

  if (
    skills.includes('Python')
  ) {
    score += 3
  }

  return Math.min(
    score,
    98
  )
}

// ========================================
// RECHERCHE SMARTRECRUITERS
// ========================================

async function rechercher(
  companyIdentifier,
  recherche
) {
  const resultat = []

  let offset = 0

  const limit = 100

  while (true) {
    const params =
      new URLSearchParams()

    params.set(
      'q',
      recherche
    )

    params.set(
      'country',
      'fr'
    )

    params.set(
      'destination',
      'PUBLIC'
    )

    params.set(
      'limit',
      String(limit)
    )

    params.set(
      'offset',
      String(offset)
    )

    const url =
      `https://api.smartrecruiters.com/v1/companies/${companyIdentifier}/postings?${params.toString()}`

    const response =
      await fetch(url)

    if (!response.ok) {
      console.log(
        `⚠️ ${companyIdentifier}: ${response.status}`
      )

      break
    }

    const data =
      await response.json()

    resultat.push(
      ...(data.content || [])
    )

    offset += limit

    if (
      offset >=
      data.totalFound
    ) {
      break
    }
  }

  return resultat
}

// ========================================
// DÉTAIL D'UNE OFFRE
// ========================================

async function chargerDetail(
  companyIdentifier,
  postingId
) {
  try {
    const url =
      `https://api.smartrecruiters.com/v1/companies/${companyIdentifier}/postings/${postingId}`

    const response =
      await fetch(url)

    if (!response.ok) {
      return null
    }

    return await response.json()

  } catch (error) {
    console.error(
      error
    )

    return null
  }
}

// ========================================
// CONVERSION EN FORMAT ALTERNANCERADAR
// ========================================

function transformer(
  job,
  companyLabel,
  companyIdentifier
) {
  const skills =
    trouverCompetences(job)

  const location =
    job.location?.city ||
    job.location?.region ||
    'France'

  const url =
    job.applyUrl ||
    job.postingUrl ||
    `https://careers.smartrecruiters.com/${companyIdentifier}`

  return {
    id:
      creerId(
        `${companyIdentifier}-${job.id}`
      ),

    company:
      job.company?.name ||
      companyLabel,

    title:
      job.name,

    location,

    contractType:
      job.typeOfEmployment
        ?.label ||
      'Alternance / Apprentissage',

    publishedAt:
      job.releasedDate ||
      '',

    url,

    category:
      trouverCategorie(job),

    remote:
      Boolean(
        job.location?.remote
      ),

    skills,

    matchScore:
      calculerScore(
        job,
        skills
      ),

    status:
      'active',

    source:
      'SmartRecruiters',
  }
}

// ========================================
// CHARGER UNE ENTREPRISE
// ========================================

async function chargerEntreprise(
  company
) {
  console.log(
    `🔎 ${company.label}`
  )

  const publications =
    new Map()

  for (
    const recherche
    of SEARCHES
  ) {
    try {
      const resultats =
        await rechercher(
          company.identifier,
          recherche
        )

      resultats.forEach(
        (job) => {
          publications.set(
            job.id,
            job
          )
        }
      )

    } catch (error) {
      console.error(
        company.label,
        error
      )
    }
  }

  console.log(
    `   ${publications.size} annonces potentielles`
  )

  const details =
    await Promise.all(
      [...publications.values()]
        .map(
          (job) =>
            chargerDetail(
              company.identifier,
              job.id
            )
        )
    )

  const offres =
    details
      .filter(
        (job) =>
          job !== null &&
          job.active !== false
      )
      .filter(
        estAlternance
      )
      .filter(
        estPertinent
      )
      .map(
        (job) =>
          transformer(
            job,
            company.label,
            company.identifier
          )
      )

  console.log(
    `   ✅ ${offres.length} offres retenues`
  )

  return offres
}

// ========================================
// DÉDOUBLONNAGE
// ========================================

function dedoublonner(jobs) {
  const uniques =
    new Map()

  jobs.forEach(
    (job) => {
      const cle =
        [
          job.company,
          job.title,
          job.location,
        ]
          .join('|')
          .toLowerCase()

      if (
        !uniques.has(cle)
      ) {
        uniques.set(
          cle,
          job
        )
      }
    }
  )

  return [
    ...uniques.values(),
  ]
}

// ========================================
// PROGRAMME PRINCIPAL
// ========================================

async function main() {
  console.log(
    '🚀 Mise à jour AlternanceRadar'
  )

  console.log(
    `📅 ${new Date().toISOString()}`
  )

  const resultats =
    await Promise.allSettled(
      COMPANIES.map(
        chargerEntreprise
      )
    )

  const toutesLesOffres =
    resultats.flatMap(
      (resultat) => {

        if (
          resultat.status ===
          'fulfilled'
        ) {
          return resultat.value
        }

        console.error(
          resultat.reason
        )

        return []
      }
    )

  const jobs =
    dedoublonner(
      toutesLesOffres
    )
      .sort(
        (a, b) =>
          new Date(
            b.publishedAt
          ).getTime() -
          new Date(
            a.publishedAt
          ).getTime()
      )

  const fichier = {
    generatedAt:
      new Date()
        .toISOString(),

    count:
      jobs.length,

    jobs,
  }

  await mkdir(
    'public',
    {
      recursive: true,
    }
  )

  await writeFile(
    'public/jobs.json',

    JSON.stringify(
      fichier,
      null,
      2
    ),

    'utf8'
  )

  console.log(
    ''
  )

  console.log(
    `🎯 ${jobs.length} offres sauvegardées`
  )

  console.log(
    '📁 public/jobs.json créé'
  )
}

main()
  .catch(
    (error) => {
      console.error(
        '❌ Erreur fatale',
        error
      )

      process.exit(1)
    }
  )
