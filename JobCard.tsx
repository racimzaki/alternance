import type { ApplicationStatus, JobOffer } from '../types/JobOffer';

type JobCardProps = {
  job: JobOffer;

  applicationStatus: ApplicationStatus;

  onStatusChange: (jobId: number, status: ApplicationStatus) => void;
};

function formaterDate(date: string) {
  if (!date) {
    return 'Date inconnue';
  }

  const valeur = new Date(date);

  if (Number.isNaN(valeur.getTime())) {
    return date;
  }

  return valeur.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
function depuisCombienDeTemps(date: string) {
  if (!date) {
    return 'Date inconnue';
  }

  const publication = new Date(date);
  const maintenant = new Date();

  const difference = maintenant.getTime() - publication.getTime();

  const jours = Math.floor(difference / (1000 * 60 * 60 * 24));

  if (jours <= 0) {
    return "Publiée aujourd'hui";
  }

  if (jours === 1) {
    return 'Publiée hier';
  }

  if (jours < 7) {
    return `Publiée il y a ${jours} jours`;
  }

  const semaines = Math.floor(jours / 7);

  if (semaines === 1) {
    return 'Publiée il y a 1 semaine';
  }

  if (semaines < 5) {
    return `Publiée il y a ${semaines} semaines`;
  }

  const mois = Math.floor(jours / 30);

  return `Publiée il y a ${mois} mois`;
}
function JobCard({ job, applicationStatus, onStatusChange }: JobCardProps) {
  function changerStatut(event: React.ChangeEvent<HTMLSelectElement>) {
    const nouveauStatut = event.target.value as ApplicationStatus;

    onStatusChange(job.id, nouveauStatut);
  }

  return (
    <article className="job-card">
      <div className="job-top">
        <div>
          <p className="company">{job.company}</p>

          <h2>{job.title}</h2>
        </div>

        <div className="match-score">
          {job.matchScore}%<span>match</span>
        </div>
      </div>

      <div className="job-meta">
        <span>📍 {job.location}</span>

        <span>🎓 {job.contractType}</span>

        <span>{job.remote ? '🏠 Télétravail' : '🏢 Sur site / hybride'}</span>

        <span>🔎 {job.source}</span>
      </div>

      <div className="skills">
        {job.skills.map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>

      <div className="job-footer">
        <div>
          <p className="published-date">
            {depuisCombienDeTemps(job.publishedAt)}

            {' • '}

            {formaterDate(job.publishedAt)}
          </p>

          <select
            className="status-select"
            value={applicationStatus}
            onChange={changerStatut}
          >
            <option value="À étudier">À étudier</option>

            <option value="Candidature envoyée">Candidature envoyée</option>

            <option value="Entretien">Entretien</option>

            <option value="Offre reçue">Offre reçue</option>

            <option value="Refus">Refus</option>
          </select>
        </div>

        <a href={job.url} target="_blank" rel="noreferrer">
          Voir l'offre →
        </a>
      </div>
    </article>
  );
}

export default JobCard;
