import type { JobOffer } from '../types/JobOffer';

import { fetchSmartRecruitersJobs } from './smartRecruitersJobs';

// ========================================
// DÉDOUBLONNAGE
// ========================================

function dedoublonner(jobs: JobOffer[]) {
  const uniques = new Map<string, JobOffer>();

  jobs.forEach((job) => {
    const cle = [job.company, job.title, job.location].join('|').toLowerCase();

    if (!uniques.has(cle)) {
      uniques.set(cle, job);
    }
  });

  return [...uniques.values()];
}

// ========================================
// TOUTES LES SOURCES
// ========================================

export async function fetchAllJobs(): Promise<JobOffer[]> {
  const resultats = await Promise.allSettled([
    fetchSmartRecruitersJobs(),

    // PLUS TARD :
    // fetchGreenhouseJobs()
    // fetchLeverJobs()
    // fetchBankJobs()
  ]);

  const jobs = resultats.flatMap((resultat) => {
    if (resultat.status === 'fulfilled') {
      return resultat.value;
    }

    console.error('Erreur source :', resultat.reason);

    return [];
  });

  return dedoublonner(jobs).sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
