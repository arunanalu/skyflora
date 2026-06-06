import csv
from collections import defaultdict

CSV_FILENAME = "gastos_deputados_consolidado.csv"
DEP_RANKING_CSV = "ranking_gastos_deputados.csv"
PARTIDO_RANKING_CSV = "ranking_gastos_partidos.csv"

def analyze():
    gastos_por_deputado = defaultdict(float)
    gastos_por_partido = defaultdict(float)
    deputado_info = {} # Mapear id para (nome, partido, uf)
    
    # Ler os dados e agrupar
    with open(CSV_FILENAME, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                valor = float(row['valor_liquido']) if row['valor_liquido'] else 0.0
            except ValueError:
                continue
            
            dep_id = row['deputado_id']
            dep_name = row['deputado_nome']
            partido = row['deputado_partido']
            uf = row['deputado_uf']
            
            if dep_id:
                gastos_por_deputado[dep_id] += valor
                deputado_info[dep_id] = (dep_name, partido, uf)
                
            if partido:
                gastos_por_partido[partido] += valor
                
    # Ordenar dados
    ranking_deputados = sorted(gastos_por_deputado.items(), key=lambda x: x[1], reverse=True)
    ranking_partidos = sorted(gastos_por_partido.items(), key=lambda x: x[1], reverse=True)
    
    # Salvar ranking de deputados
    with open(DEP_RANKING_CSV, mode='w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(['deputado_id', 'deputado_nome', 'deputado_partido', 'deputado_uf', 'total_gasto'])
        for dep_id, total in ranking_deputados:
            nome, partido, uf = deputado_info[dep_id]
            writer.writerow([dep_id, nome, partido, uf, f"{total:.2f}"])
            
    # Salvar ranking de partidos
    with open(PARTIDO_RANKING_CSV, mode='w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(['partido', 'total_gasto'])
        for partido, total in ranking_partidos:
            writer.writerow([partido, f"{total:.2f}"])
            
    print("--- TOP 10 DEPUTADOS QUE MAIS GASTARAM ---")
    for i, (dep_id, total) in enumerate(ranking_deputados[:10], 1):
        nome, partido, uf = deputado_info[dep_id]
        print(f"{i}. {nome} ({partido}-{uf}) - ID: {dep_id}: R$ {total:,.2f}")
        
    print("\n--- GASTOS TOTAIS POR PARTIDO ---")
    for i, (partido, total) in enumerate(ranking_partidos, 1):
        print(f"{i}. {partido}: R$ {total:,.2f}")

if __name__ == "__main__":
    analyze()
