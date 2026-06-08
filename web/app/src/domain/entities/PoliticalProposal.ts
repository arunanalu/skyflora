export interface PoliticalProposal {
  id: string;
  title: string;
  description: string;
  author: string;
  stateId: string; // Estado de origem ou impacto
  isBeneficial: boolean; // Se a proposta ajuda ou prejudica o clima
  status: 'Aprovada' | 'Em Tramitação' | 'Rejeitada';
  date: string; // ISO Date String
}
