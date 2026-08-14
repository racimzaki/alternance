import type { JobOffer } from '../types/JobOffer';

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

  // =========================
  // NOUVELLES ENTREPRISES
  // =========================

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

  // Banque surveillée
  {
    identifier: 'SocieteGenerale4',
    label: 'Société Générale',
  },

  // Orange Business / Data
  {
    identifier: 'BusinessDecision',
    label: 'Business & Decision',
  },
];

// On recherche ces mots dans les titres
// pour trouver les contrats étudiants.

const ALTERNANCE_SEARCHES = [
  'alternance',
  'alternant',
  'apprenti',
  'apprentissage',
  'apprenticeship',
];

// ========================================
// TYPES SMARTRECRUITERS
// ========================================

type SmartLocation = {
  city?: string;
  region?: string;
  country?: string;
  remote?: boolean;
};

type SmartCompany = {
  identifier?: string;
  name?: string;
};

type SmartEmployment = {
  id?: string;
  label?: string;
};

type SmartPosting = {
  id: string;
  uuid?: string;
  name: string;
  releasedDate?: string;
  company?: SmartCompany;
  location?: SmartLocation;
  typeOfEmployment?: SmartEmployment;
};

type SmartListResponse = {
  limit: number;
  offset: number;
  totalFound: number;
  content: SmartPosting[];
};

type SmartSection = {
  title?: string;
  text?: string;
};

type SmartPostingDetails = SmartPosting & {
  postingUrl?: string;
  applyUrl?: string;
  active?: boolean;

  jobAd?: {
    sections?: {
      companyDescription?: SmartSection;
      jobDescription?: SmartSection;
      qualifications?: SmartSection;
      additionalInformation?: SmartSection;
    };
  };
};

// ========================================
// OUTILS
// ========================================

function normaliser(texte = '') {
  return texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function retirerHTML(texte = '') {
  return texte
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function creerId(texte: string) {
  let hash = 0;

  for (let i = 0; i < texte.length; i++) {
    hash = (hash << 5) - hash + texte.charCodeAt(i);

    hash |= 0;
  }

  return Math.abs(hash);
}

// ========================================
// TEXTE COMPLET DE L'ANNONCE
// ========================================

function obtenirTexteComplet(job: SmartPostingDetails) {
  const sections = job.jobAd?.sections;

  return retirerHTML(
    [
      job.name,

      sections?.jobDescription?.text,

      sections?.qualifications?.text,

      sections?.additionalInformation?.text,
    ]
      .filter(Boolean)
      .join(' ')
  );
}

// ========================================
// PERTINENCE POUR NOTRE PROFIL
// ========================================

function estPertinent(job: SmartPostingDetails) {
  const texte = normaliser(obtenirTexteComplet(job));

  const motsCles = [
    'business analyst',
    'data analyst',
    'business intelligence',
    'bi analyst',
    'power bi',
    'amoa',
    'product owner',
    'product management',
    'chef de projet',
    'gestion de projet',
    'pmo',
    'transformation digitale',
    'transformation numerique',
    'systeme d information',
    'systemes d information',
    'consultant fonctionnel',
    'sap',
    'data intelligence',
    'analyse de donnees',
    'analyse des donnees',
    'reporting',
  ];

  return motsCles.some((mot) => texte.includes(mot));
}

// ========================================
// CATÉGORIE
// ========================================

function trouverCategorie(job: SmartPostingDetails) {
  const texte = normaliser(obtenirTexteComplet(job));

  if (texte.includes('business analyst') || texte.includes('amoa')) {
    return 'Business Analyst';
  }

  if (
    texte.includes('business intelligence') ||
    texte.includes('power bi') ||
    texte.includes('bi analyst')
  ) {
    return 'BI';
  }

  if (
    texte.includes('data analyst') ||
    texte.includes('analyse de donnees') ||
    texte.includes('analyse des donnees')
  ) {
    return 'Data';
  }

  if (texte.includes('product owner') || texte.includes('product management')) {
    return 'Product';
  }

  if (texte.includes('pmo') || texte.includes('chef de projet')) {
    return 'Project Management';
  }

  if (
    texte.includes('sap') ||
    texte.includes('consultant fonctionnel') ||
    texte.includes('systeme d information') ||
    texte.includes('systemes d information')
  ) {
    return 'SI';
  }

  return 'Autre';
}

// ========================================
// COMPÉTENCES
// ========================================

function trouverCompetences(job: SmartPostingDetails) {
  const texte = normaliser(obtenirTexteComplet(job));

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
  ];

  const resultats = competences.filter((competence) =>
    texte.includes(normaliser(competence))
  );

  return resultats.length ? resultats : ['À analyser'];
}

// ========================================
// SCORE DE PERTINENCE
// ========================================

function calculerScore(job: SmartPostingDetails, skills: string[]) {
  const texte = normaliser(obtenirTexteComplet(job));

  let score = 50;

  if (texte.includes('business analyst')) {
    score += 25;
  }

  if (texte.includes('data analyst')) {
    score += 22;
  }

  if (texte.includes('amoa')) {
    score += 20;
  }

  if (texte.includes('business intelligence')) {
    score += 18;
  }

  if (texte.includes('product owner')) {
    score += 15;
  }

  if (texte.includes('consultant fonctionnel')) {
    score += 12;
  }

  if (texte.includes('pmo')) {
    score += 10;
  }

  if (skills.includes('SQL')) {
    score += 5;
  }

  if (skills.includes('Power BI')) {
    score += 5;
  }

  if (skills.includes('Excel')) {
    score += 3;
  }

  if (skills.includes('Agile')) {
    score += 3;
  }

  return Math.min(score, 98);
}

// ========================================
// RÉCUPÉRER UNE RECHERCHE
// ========================================

async function rechercherOffres(
  companyIdentifier: string,
  recherche: string
): Promise<SmartPosting[]> {
  const resultat: SmartPosting[] = [];

  let offset = 0;
  const limit = 100;

  while (true) {
    const params = new URLSearchParams();

    params.set('q', recherche);

    params.set('country', 'fr');

    params.set('destination', 'PUBLIC');

    params.set('limit', String(limit));

    params.set('offset', String(offset));

    const url = `https://api.smartrecruiters.com/v1/companies/${companyIdentifier}/postings?${params.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`SmartRecruiters ${companyIdentifier} : ${response.status}`);

      break;
    }

    const data: SmartListResponse = await response.json();

    resultat.push(...(data.content || []));

    offset += limit;

    if (offset >= data.totalFound) {
      break;
    }
  }

  return resultat;
}

// ========================================
// DÉTAIL D'UNE OFFRE
// ========================================

async function chargerDetail(
  companyIdentifier: string,
  postingId: string
): Promise<SmartPostingDetails | null> {
  try {
    const url = `https://api.smartrecruiters.com/v1/companies/${companyIdentifier}/postings/${postingId}`;

    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

// ========================================
// TRANSFORMER EN JOBOFFER
// ========================================

function transformerJob(
  job: SmartPostingDetails,
  companyLabel: string,
  companyIdentifier: string
): JobOffer {
  const skills = trouverCompetences(job);

  const ville = job.location?.city || job.location?.region || 'France';

  const url =
    job.postingUrl ||
    job.applyUrl ||
    `https://careers.smartrecruiters.com/${companyIdentifier}`;

  return {
    id: creerId(`${companyIdentifier}-${job.id}`),

    company: job.company?.name || companyLabel,

    title: job.name,

    location: ville,

    contractType: 'Alternance / Apprentissage',

    publishedAt: job.releasedDate || '',

    url,

    category: trouverCategorie(job),

    remote: Boolean(job.location?.remote),

    skills,

    matchScore: calculerScore(job, skills),

    status: 'active',

    source: 'SmartRecruiters',
  };
}

// ========================================
// CHARGER UNE ENTREPRISE
// ========================================

async function chargerEntreprise(
  companyIdentifier: string,
  companyLabel: string
): Promise<JobOffer[]> {
  const publications = new Map<string, SmartPosting>();

  // On effectue plusieurs recherches
  // pour trouver les contrats étudiants.

  for (const recherche of ALTERNANCE_SEARCHES) {
    try {
      const resultats = await rechercherOffres(companyIdentifier, recherche);

      resultats.forEach((job) => {
        publications.set(job.id, job);
      });
    } catch (error) {
      console.error(companyLabel, error);
    }
  }

  // On charge les descriptions complètes.

  const details = await Promise.all(
    [...publications.values()].map((job) =>
      chargerDetail(companyIdentifier, job.id)
    )
  );

  return details

    .filter(
      (job): job is SmartPostingDetails => job !== null && job.active !== false
    )

    .filter(estPertinent)

    .map((job) => transformerJob(job, companyLabel, companyIdentifier));
}

// ========================================
// EXPORT FINAL
// ========================================

export async function fetchSmartRecruitersJobs(): Promise<JobOffer[]> {
  const resultats = await Promise.allSettled(
    COMPANIES.map((company) =>
      chargerEntreprise(company.identifier, company.label)
    )
  );

  const jobs = resultats.flatMap((resultat) => {
    if (resultat.status === 'fulfilled') {
      return resultat.value;
    }

    console.error(resultat.reason);

    return [];
  });

  return jobs;
}
