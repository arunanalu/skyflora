import { CO2CategoryEntry, CO2Emission, CO2Sector } from '../../domain/entities/CO2Emission';
import { DatabricksCO2StateDTO } from '../dtos/DatabricksCO2StateDTO';

const EXCLUDED_UFS = new Set(['NA']);

export function mapDatabricksCO2StatesToCO2Emissions(rows: DatabricksCO2StateDTO[]): CO2Emission[] {
  // Group rows by UF
  const byUf = new Map<string, DatabricksCO2StateDTO[]>();
  for (const row of rows) {
    if (EXCLUDED_UFS.has(row.uf)) continue;
    const existing = byUf.get(row.uf);
    if (existing) {
      existing.push(row);
    } else {
      byUf.set(row.uf, [row]);
    }
  }

  const result: CO2Emission[] = [];

  for (const [uf, stateRows] of byUf) {
    // Sum unique sectors to avoid double-counting (emissao_total_setor repeats per sector)
    const uniqueSectors = new Map<string, number>();
    for (const row of stateRows) {
      if (!uniqueSectors.has(row.setor_emissor)) {
        uniqueSectors.set(row.setor_emissor, row.emissao_total_setor);
      }
    }
    const totalEmission = Array.from(uniqueSectors.values()).reduce((sum, v) => sum + v, 0);

    // Find dominant sector (highest percentual_setor_estado, deduplicated per sector)
    const sectorShareByName = new Map<string, number>();
    for (const row of stateRows) {
      if (!sectorShareByName.has(row.setor_emissor)) {
        sectorShareByName.set(row.setor_emissor, row.percentual_setor_estado);
      }
    }
    let dominantSector = stateRows[0].setor_emissor;
    let dominantShare = -1;
    for (const [sector, share] of sectorShareByName) {
      if (share > dominantShare) {
        dominantShare = share;
        dominantSector = sector;
      }
    }

    // Build top5 sorted by categoryEmission descending
    const top5: CO2CategoryEntry[] = stateRows
      .map((row): CO2CategoryEntry => ({
        sector: row.setor_emissor as CO2Sector,
        sectorTotalEmission: row.emissao_total_setor,
        sectorShareOfState: row.percentual_setor_estado,
        category: row.categoria_emissora.trim(),
        categoryEmission: row.emissao_total_categoria,
        categoryShareOfSector: row.percentual_categoria_setor,
        recordCount: row.quantidade_registros ?? 0,
      }))
      .sort((a, b) => b.categoryEmission - a.categoryEmission);

    const lastRow = stateRows[stateRows.length - 1];

    result.push({
      stateId: uf,
      stateName: stateRows[0].estado,
      year: new Date(lastRow.data_processamento).getFullYear(),
      totalEmission,
      dominantSector: dominantSector as CO2Sector,
      top5,
      processedAt: lastRow.timestamp_processamento,
    });
  }

  // Sort by totalEmission descending (most emitting states first)
  result.sort((a, b) => b.totalEmission - a.totalEmission);

  return result;
}
