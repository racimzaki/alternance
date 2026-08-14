export type ApplicationStatus =
  | 'À étudier'
  | 'Candidature envoyée'
  | 'Entretien'
  | 'Offre reçue'
  | 'Refus';

export type JobOffer = {
  id: number;
  company: string;
  title: string;
  location: string;
  contractType: string;
  publishedAt: string;
  url: string;
  category: string;
  remote: boolean;
  skills: string[];
  matchScore: number;
  status: 'active' | 'inactive';
  source: string;
};
