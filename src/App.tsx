import { useEffect, useState } from 'react';

import JobCard from './components/JobCard';
import KpiCard from './components/KpiCard';

import { fetchAllJobs } from './services/jobAggregator';

import type { ApplicationStatus, JobOffer } from './types/JobOffer';

function App() {
  // ========================================
  // OFFRES RÉELLES
  // ========================================

  const [jobs, setJobs] = useState<JobOffer[]>([]);

  const [loading, setLoading] = useState(true);

  const [erreur, setErreur] = useState('');

  useEffect(() => {
    async function charger() {
      try {
        setErreur('');

        const data = await fetchAllJobs();

        setJobs(data);
      } catch (error) {
        console.error(error);

        setErreur('Impossible de charger les offres.');
      } finally {
        setLoading(false);
      }
    }

    // Chargement immédiat
    charger();

    // Actualisation automatique toutes les heures
    const interval = setInterval(charger, 60 * 60 * 1000);

    // Nettoyage quand on quitte l'application
    return () => {
      clearInterval(interval);
    };
  }, []);

  // ========================================
  // FILTRES
  // ========================================

  const [ville, setVille] = useState('Toutes');

  const [metier, setMetier] = useState('Tous');

  const [source, setSource] = useState('Toutes');

  const [recherche, setRecherche] = useState('');

  const [tri, setTri] = useState('match');

  // ========================================
  // TRACKING DES CANDIDATURES
  // ========================================

  const [applications, setApplications] = useState<
    Record<number, ApplicationStatus>
  >(() => {
    const sauvegarde = localStorage.getItem('alternanceRadarApplications');

    return sauvegarde ? JSON.parse(sauvegarde) : {};
  });

  useEffect(() => {
    localStorage.setItem(
      'alternanceRadarApplications',

      JSON.stringify(applications)
    );
  }, [applications]);

  function changerStatut(jobId: number, status: ApplicationStatus) {
    setApplications((ancien) => ({
      ...ancien,

      [jobId]: status,
    }));
  }

  // ========================================
  // OPTIONS DYNAMIQUES
  // ========================================

  const villes = [
    'Toutes',

    ...new Set(jobs.map((job) => job.location).filter(Boolean)),
  ];

  const metiers = ['Tous', ...new Set(jobs.map((job) => job.category))];

  const sources = ['Toutes', ...new Set(jobs.map((job) => job.source))];

  // ========================================
  // FILTRAGE
  // ========================================

  const jobsFiltres = jobs

    .filter((job) => {
      const villeOK = ville === 'Toutes' || job.location === ville;

      const metierOK = metier === 'Tous' || job.category === metier;

      const sourceOK = source === 'Toutes' || job.source === source;

      const texte = `
            ${job.company}
            ${job.title}
            ${job.location}
            ${job.category}
            ${job.skills.join(' ')}
          `.toLowerCase();

      const rechercheOK = texte.includes(recherche.trim().toLowerCase());

      return villeOK && metierOK && sourceOK && rechercheOK;
    })

    .sort((a, b) => {
      if (tri === 'date') {
        return (
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
      }

      return b.matchScore - a.matchScore;
    });

  // ========================================
  // KPI
  // ========================================

  const candidaturesEnvoyees = Object.values(applications).filter(
    (statut) => statut === 'Candidature envoyée'
  ).length;

  const entretiens = Object.values(applications).filter(
    (statut) => statut === 'Entretien'
  ).length;

  const nombreSources = new Set(jobs.map((job) => job.source)).size;

  // ========================================
  // COMPÉTENCES
  // ========================================

  const compteurCompetences: Record<string, number> = {};

  jobs.forEach((job) => {
    job.skills.forEach((skill) => {
      if (skill === 'À analyser') {
        return;
      }

      compteurCompetences[skill] = (compteurCompetences[skill] || 0) + 1;
    });
  });

  const competencesTop = Object.entries(compteurCompetences)

    .sort((a, b) => b[1] - a[1])

    .slice(0, 5);

  // ========================================
  // INTERFACE
  // ========================================

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">JOB MARKET INTELLIGENCE</p>

          <h1>AlternanceRadar</h1>

          <p className="subtitle">
            Agrège les alternances Business Analyst, Data, BI et SI publiées
            directement par les entreprises.
          </p>
        </div>

        <div className="header-badge">LIVE JOB DATA</div>
      </header>

      {/* CHARGEMENT */}

      {loading && (
        <div className="empty-message">
          <h3>Recherche en cours...</h3>

          <p>Analyse des offres Bosch, Sopra Steria et Talan.</p>
        </div>
      )}

      {/* ERREUR */}

      {!loading && erreur && (
        <div className="empty-message">
          <h3>Erreur</h3>

          <p>{erreur}</p>
        </div>
      )}

      {!loading && !erreur && (
        <>
          {/* KPI */}

          <section className="kpi-grid">
            <KpiCard
              icon="🎯"
              value={jobs.length}
              label="Alternances actives"
            />

            <KpiCard
              icon="🌐"
              value={nombreSources}
              label="Sources connectées"
            />

            <KpiCard
              icon="📨"
              value={candidaturesEnvoyees}
              label="Candidatures envoyées"
            />

            <KpiCard icon="🤝" value={entretiens} label="Entretiens" />
          </section>

          {/* MARKET INSIGHTS */}

          {competencesTop.length > 0 && (
            <section className="market-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">MARKET INSIGHTS</p>

                  <h2>Compétences les plus demandées</h2>
                </div>
              </div>

              <div className="skills-ranking">
                {competencesTop.map(([skill, count]) => (
                  <div className="skill-ranking-card" key={skill}>
                    <strong>{skill}</strong>

                    <span>
                      {count} offre
                      {count > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* JOB BOARD */}

          <section className="filters-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">JOB BOARD</p>

                <h2>Alternances disponibles</h2>
              </div>

              <span className="result-count">
                {jobsFiltres.length} résultat
                {jobsFiltres.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* RECHERCHE */}

            <div className="search-box">
              <input
                type="text"
                placeholder="Business Analyst, Data, SQL, Power BI..."
                value={recherche}
                onChange={(event) => setRecherche(event.target.value)}
              />
            </div>

            {/* FILTRES */}

            <div className="filters">
              <select
                value={ville}
                onChange={(event) => setVille(event.target.value)}
              >
                {villes.map((option) => (
                  <option key={option} value={option}>
                    {option === 'Toutes' ? 'Toutes les villes' : option}
                  </option>
                ))}
              </select>

              <select
                value={metier}
                onChange={(event) => setMetier(event.target.value)}
              >
                {metiers.map((option) => (
                  <option key={option} value={option}>
                    {option === 'Tous' ? 'Tous les métiers' : option}
                  </option>
                ))}
              </select>

              <select
                value={source}
                onChange={(event) => setSource(event.target.value)}
              >
                {sources.map((option) => (
                  <option key={option} value={option}>
                    {option === 'Toutes' ? 'Toutes les sources' : option}
                  </option>
                ))}
              </select>

              <select
                value={tri}
                onChange={(event) => setTri(event.target.value)}
              >
                <option value="match">Meilleur match</option>

                <option value="date">Plus récentes</option>
              </select>
            </div>
          </section>

          {/* OFFRES */}

          <section className="jobs-section">
            {jobsFiltres.length > 0 ? (
              jobsFiltres.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  applicationStatus={applications[job.id] || 'À étudier'}
                  onStatusChange={changerStatut}
                />
              ))
            ) : (
              <div className="empty-message">
                <h3>Aucune offre trouvée</h3>

                <p>
                  Aucune alternance correspondant aux critères n'est
                  actuellement publiée par les sources connectées.
                </p>
              </div>
            )}
          </section>
        </>
      )}

      <footer className="footer">
        <strong>AlternanceRadar</strong>

        <span>Données carrières SmartRecruiters</span>
      </footer>
    </main>
  );
}

export default App;
