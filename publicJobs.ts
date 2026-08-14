import type { JobOffer } from '../types/JobOffer';

// ===============================
// CONFIGURATION
// ===============================

const RESOURCE_ID = '867034a2-2fa1-41b4-bd39-c84691ea618f';

const API_URL = `https://tabular-api.data.gouv.fr/api/resources/${RESOURCE_ID}/data/`;

const MAX_PAGES = 12;

type RawJob = Record<string, unknown>;

type ApiResponse = {
  data?: RawJob[];
};

// ===============================
// OUTILS TEXTE
// ===============================

function lireTexte(job: RawJob, champ: string, valeurParDefaut = '') {
  const valeur = job[champ];

  if (valeur === null || valeur === undefined) {
    return valeurParDefaut;
  }

  return String(valeur).trim();
}

function normaliser(texte: string) {
  return texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function texteComplet(job: RawJob) {
  return normaliser(
    Object.values(job)
      .filter((valeur) => valeur !== null && valeur !== undefined)
      .join(' ')
  );
}

// ===============================
// DATE DU JOUR
// ===============================

function dateDuJour() {
  const maintenant = new Date();

  const annee = maintenant.getFullYear();

  const mois = String(maintenant.getMonth() + 1).padStart(2, '0');

  const jour = String(maintenant.getDate()).padStart(2, '0');

  return `${annee}-${mois}-${jour}`;
}

// ===============================
// OFFRE ENCORE ACTIVE ?
// ===============================

function offreEncoreValide(job: RawJob) {
  const dateFin = lireTexte(job, 'Date de fin de publication par défaut');

  if (!dateFin) {
    return false;
  }

  const aujourdHui = dateDuJour();

  const expiration = dateFin.slice(0, 10);

  return expiration >= aujourdHui;
}

// ===============================
// EST-CE UNE ALTERNANCE ?
// ===============================

function estAlternance(job: RawJob) {
  const titre = normaliser(lireTexte(job, 'Intitulé du poste'));

  const natureContrat = normaliser(lireTexte(job, 'Nature du contrat'));

  // Contrat explicitement identifié

  if (
    natureContrat.includes('apprentissage') ||
    natureContrat.includes('alternance') ||
    natureContrat.includes('professionnalisation')
  ) {
    return true;
  }

  // Certains postes d'apprentissage
  // sont surtout identifiés par leur titre

  if (titre.includes('apprentissage')) {
    return true;
  }

  if (titre.startsWith('alternance')) {
    return true;
  }

  if (
    titre.includes('apprenti') ||
    titre.includes('apprentie') ||
    titre.includes('alternant') ||
    titre.includes('alternante')
  ) {
    return true;
  }

  return false;
}

// ===============================
// MÉTIER PERTINENT ?
// ===============================

function estMetierPertinent(job: RawJob) {
  const texte = texteComplet(job);

  const motsCles = [
    'business analyst',

    'data analyst',

    'bi analyst',

    'business intelligence',

    'power bi',

    'data science',

    'data scientist',

    'analyse de donnees',

    'analyse des donnees',

    'traitement et analyse de donnees',

    'amoa',

    'assistant maitrise ouvrage',

    'assistance a maitrise ouvrage',

    'product owner',

    'chef de projet si',

    'chef de projet numerique',

    'systeme d information',

    'systemes d information',

    'pilotage si',

    'transformation digitale',

    'transformation numerique',
  ];

  return motsCles.some((motCle) => texte.includes(motCle));
}

// ===============================
// CATÉGORIE
// ===============================

function trouverCategorie(job: RawJob) {
  const texte = texteComplet(job);

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

  if (texte.includes('data') || texte.includes('donnee')) {
    return 'Data';
  }

  if (texte.includes('product owner')) {
    return 'Product';
  }

  if (
    texte.includes('systeme d information') ||
    texte.includes('systemes d information') ||
    texte.includes('chef de projet si') ||
    texte.includes('numerique')
  ) {
    return 'SI';
  }

  return 'Autre';
}

// ===============================
// COMPÉTENCES
// ===============================

function trouverCompetences(job: RawJob) {
  const texte = texteComplet(job);

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
  ];

  const trouvees = competences.filter((competence) =>
    texte.includes(normaliser(competence))
  );

  if (trouvees.length === 0) {
    return ['À analyser'];
  }

  return trouvees;
}

// ===============================
// SCORE DE MATCH
// ===============================

function calculerMatch(job: RawJob, skills: string[]) {
  const texte = texteComplet(job);

  let score = 50;

  if (texte.includes('business analyst')) {
    score += 25;
  }

  if (texte.includes('data analyst')) {
    score += 22;
  }

  if (texte.includes('business intelligence')) {
    score += 18;
  }

  if (texte.includes('amoa')) {
    score += 20;
  }

  if (texte.includes('product owner')) {
    score += 15;
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

  if (skills.includes('Python')) {
    score += 3;
  }

  return Math.min(score, 98);
}

// ===============================
// TRANSFORMATION
// ===============================

function transformerJob(job: RawJob): JobOffer {
  const reference = lireTexte(job, 'Référence');

  const title = lireTexte(job, 'Intitulé du poste', 'Offre en alternance');

  const company =
    lireTexte(job, 'Employeur') ||
    lireTexte(job, 'Organisme de rattachement') ||
    'Employeur public';

  const location =
    lireTexte(job, "Lieu d'affectation (sans géolocalisation)") ||
    lireTexte(job, 'Localisation du poste') ||
    lireTexte(job, "Lieu d'affectation") ||
    'France';

  const publishedAt = lireTexte(job, 'Date de début de publication par défaut');

  const teletravail = normaliser(lireTexte(job, 'Télétravail'));

  const skills = trouverCompetences(job);

  const idStable =
    Number(reference.replace(/\D/g, '')) || Number(job.__id) || Date.now();

  return {
    id: idStable,

    company,

    title,

    location,

    contractType: 'Alternance / Apprentissage',

    publishedAt,

    url: reference
      ? `https://choisirleservicepublic.gouv.fr/offre-emploi/${encodeURIComponent(
          reference
        )}/`
      : 'https://choisirleservicepublic.gouv.fr/',

    category: trouverCategorie(job),

    remote: teletravail.includes('oui'),

    skills,

    matchScore: calculerMatch(job, skills),

    status: 'active',
  };
}

// ===============================
// RÉCUPÉRATION D'UNE PAGE
// ===============================

async function chargerPage(page: number): Promise<RawJob[]> {
  const aujourdHui = dateDuJour();

  const params = new URLSearchParams();

  params.set('page', String(page));

  params.set('page_size', '50');

  params.set('Date de fin de publication par défaut__greater', aujourdHui);

  params.set('Date de début de publication par défaut__sort', 'desc');

  let response = await fetch(`${API_URL}?${params.toString()}`);

  // Si jamais le filtre API
  // rencontre un problème,
  // on récupère quand même
  // les lignes puis on filtre côté app.

  if (!response.ok) {
    const secours = new URLSearchParams();

    secours.set('page', String(page));

    secours.set('page_size', '50');

    secours.set('Date de début de publication par défaut__sort', 'desc');

    response = await fetch(`${API_URL}?${secours.toString()}`);
  }

  if (!response.ok) {
    throw new Error(
      'Impossible de récupérer les offres Choisir le Service Public.'
    );
  }

  const resultat: ApiResponse = await response.json();

  return resultat.data || [];
}

// ===============================
// RÉCUPÉRATION FINALE
// ===============================

export async function fetchPublicJobs(): Promise<JobOffer[]> {
  const toutesLesOffres: RawJob[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const donnees = await chargerPage(page);

    toutesLesOffres.push(...donnees);

    if (donnees.length < 50) {
      break;
    }
  }

  // =========================
  // DÉDOUBLONNAGE
  // =========================

  const uniques = new Map<string, RawJob>();

  toutesLesOffres.forEach((job) => {
    const reference = lireTexte(job, 'Référence');

    if (!reference) {
      return;
    }

    uniques.set(reference, job);
  });

  // =========================
  // QUALITÉ DES DONNÉES
  // =========================

  const propres = [...uniques.values()]

    .filter(offreEncoreValide)

    .filter(estAlternance)

    .filter(estMetierPertinent)

    .map(transformerJob);

  // =========================
  // TRI DATE
  // =========================

  propres.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return propres;
}
