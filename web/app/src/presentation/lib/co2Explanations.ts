const EXPLANATIONS: Record<string, string> = {
  'Alterações de uso da terra':
    'Desmatamento e conversão de florestas e cerrado para outros usos. É o maior emissor do Brasil e libera CO₂ armazenado por décadas na vegetação.',
  'Fermentação entérica':
    'Metano produzido pela digestão de bovinos e outros ruminantes. O CH₄ tem poder de aquecimento 28× maior que o CO₂.',
  'Solos manejados':
    'Óxido nitroso liberado pelo uso de fertilizantes nitrogenados e dejetos em pastagens e lavouras. N₂O aquece 273× mais que o CO₂.',
  'Resíduos florestais':
    'Biomassa deixada após o desmatamento que apodrece ou queima, liberando carbono estocado na floresta.',
  'Transportes':
    'Queima de combustíveis fósseis por veículos leves, caminhões e aviação. Contribui diretamente com CO₂ e NOx.',
  'Disposição final':
    'Decomposição de resíduos orgânicos em aterros que gera metano — um dos destinos urbanos mais emissivos.',
  'Disposição final ':
    'Decomposição de resíduos orgânicos em aterros que gera metano — um dos destinos urbanos mais emissivos.',
  'Produção de metais':
    'Processos siderúrgicos que usam carvão como redutor, emitindo CO₂ no refino de minério de ferro e aço.',
  'Carbono orgânico no solo':
    'Perda de carbono armazenado no solo quando ele é revolvido, drenado ou exposto, especialmente em solos antes preservados.',
  'Cultivo de arroz':
    'Arroz inundado cria condições anaeróbicas que produzem metano, especialmente significativo no Rio Grande do Sul.',
  'Manejo de dejetos animais':
    'Armazenamento de esterco em condições que geram metano e N₂O — relevante em estados com suinocultura intensa como SC.',
  'Geração de eletricidade (serviço público)':
    'Emissões de usinas termelétricas que queimam gás, óleo ou carvão para gerar energia na rede pública.',
  'Produção de combustíveis':
    'Emissões fugitivas e de combustão no processamento de petróleo e gás natural, especialmente relevante no RJ.',
  'Industrial':
    'Queima de combustíveis em caldeiras, fornos e processos industriais gerais, excluindo geração de eletricidade.',
  'Produção e uso de HFCs':
    'Gases refrigerantes com potencial de aquecimento milhares de vezes maior que o CO₂, usados em ar-condicionado e refrigeração.',
  'Efluentes domésticos':
    'Tratamento de esgoto sem infraestrutura adequada, que produz metano durante a decomposição da matéria orgânica.',
  'Produtos minerais':
    'Calcário e dolomita aquecidos na produção de cimento e cal liberam CO₂ quimicamente — não apenas por combustão.',
};

const DEFAULT_EXPLANATION = 'Categoria de emissão identificada pelo inventário nacional de gases de efeito estufa (SEEG/MCTI).';

export function getCO2CategoryExplanation(category: string): string {
  return EXPLANATIONS[category] ?? EXPLANATIONS[category.trim()] ?? DEFAULT_EXPLANATION;
}
