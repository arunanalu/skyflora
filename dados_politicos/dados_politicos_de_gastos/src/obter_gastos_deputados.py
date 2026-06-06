import csv
import json
import time
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

# Configurações do Script
LEGISLATURA = 57  # Mandato atual (2023 - 2027)
CSV_FILENAME = f"gastos_deputados_legislatura_{LEGISLATURA}.csv"
MAX_WORKERS = 10   # Número de requisições simultâneas

# Lock para garantir escrita segura no arquivo CSV por múltiplas threads
csv_lock = threading.Lock()

def get_years_for_legislature(leg_id):
    """Retorna os anos correspondentes a uma determinada legislatura até o ano atual (2026)."""
    start_year = 2023 - (57 - leg_id) * 4
    current_year = 2026  # Ano atual do sistema
    years = [start_year + i for i in range(4)]
    return [y for y in years if y <= current_year]

def http_get(url):
    """Realiza uma requisição GET HTTP com tratamento de erros simples e retry."""
    headers = {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    req = urllib.request.Request(url, headers=headers)
    
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=20) as response:
                if response.status == 200:
                    return json.loads(response.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            if e.code == 429:  # Limite de requisições (Too Many Requests)
                sleep_time = 2 ** attempt
                print(f"[Aviso] Limite de requisições atingido. Aguardando {sleep_time}s para tentar novamente...")
                time.sleep(sleep_time)
                continue
            elif e.code == 404:
                return None
            print(f"[Erro] Falha HTTP {e.code} ao acessar {url}")
            return None
        except Exception as e:
            if attempt == 3:
                print(f"[Erro] Falha ao conectar em {url}: {e}")
                return None
            time.sleep(1)
    return None

def fetch_all_deputies(leg_id):
    """Obtém a lista de todos os deputados da legislatura especificada."""
    print(f"Obtendo a lista de deputados para a legislatura {leg_id}...")
    deputies = []
    url = f"https://dadosabertos.camara.leg.br/api/v2/deputados?idLegislatura={leg_id}&itens=100"
    
    while url:
        data = http_get(url)
        if not data or 'dados' not in data:
            break
        
        deputies.extend(data['dados'])
        
        next_url = None
        for link in data.get('links', []):
            if link.get('rel') == 'next':
                next_url = link.get('href')
                break
        url = next_url
        
    print(f"Total de deputados encontrados: {len(deputies)}")
    return deputies

def fetch_and_save_expenses(deputy, years, csv_writer):
    """Busca as despesas de um deputado nos anos especificados e as escreve no CSV."""
    dep_id = deputy['id']
    dep_name = deputy['nome']
    dep_party = deputy['siglaPartido']
    dep_uf = deputy['siglaUf']
    
    total_expenses_written = 0
    rows = []
    
    for year in years:
        url = f"https://dadosabertos.camara.leg.br/api/v2/deputados/{dep_id}/despesas?ano={year}&itens=100"
        
        while url:
            data = http_get(url)
            if not data or 'dados' not in data:
                break
            
            for item in data['dados']:
                # Tratamento da data para melhor visualização (YYYY-MM-DD)
                raw_date = item.get('dataDocumento')
                date_only = raw_date[:10] if raw_date else ""
                
                rows.append([
                    dep_id,
                    dep_name,
                    dep_party,
                    dep_uf,
                    item.get('ano'),
                    item.get('mes'),
                    date_only,
                    item.get('tipoDespesa'),
                    item.get('valorDocumento'),
                    item.get('valorLiquido'),
                    item.get('nomeFornecedor'),
                    item.get('cnpjCpfFornecedor'),
                    item.get('urlDocumento')
                ])
            
            # Navegar para a próxima página de despesas
            next_url = None
            for link in data.get('links', []):
                if link.get('rel') == 'next':
                    next_url = link.get('href')
                    break
            url = next_url

    if rows:
        with csv_lock:
            csv_writer.writerows(rows)
        total_expenses_written = len(rows)
        
    return dep_name, total_expenses_written

def main():
    start_time = time.time()
    years = get_years_for_legislature(LEGISLATURA)
    print(f"Período de consulta para o mandato: Anos {years}")
    
    deputies = fetch_all_deputies(LEGISLATURA)
    if not deputies:
        print("Nenhum deputado encontrado. Encerrando.")
        return
    
    # Preparar arquivo CSV
    headers = [
        'deputado_id', 'deputado_nome', 'deputado_partido', 'deputado_uf',
        'ano', 'mes', 'data_gasto', 'tipo_despesa', 'valor_documento',
        'valor_liquido', 'fornecedor_nome', 'fornecedor_cnpj_cpf', 'url_documento'
    ]
    
    print(f"Criando o arquivo {CSV_FILENAME}...")
    with open(CSV_FILENAME, mode='w', newline='', encoding='utf-8-sig') as file:
        writer = csv.writer(file)
        writer.writerow(headers)
        
        # Usando ThreadPoolExecutor para requisições em paralelo
        completed_count = 0
        total_deputies = len(deputies)
        
        print(f"Iniciando a busca de gastos com {MAX_WORKERS} threads em paralelo...")
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {
                executor.submit(fetch_and_save_expenses, deputy, years, writer): deputy 
                for deputy in deputies
            }
            
            for future in as_completed(futures):
                completed_count += 1
                dep_name, count = future.result()
                print(f"[{completed_count}/{total_deputies}] {dep_name}: {count} despesas salvas.")
                
    duration = time.time() - start_time
    print(f"\nConcluído com sucesso!")
    print(f"Dados salvos em: {CSV_FILENAME}")
    print(f"Tempo total de execução: {duration:.2f} segundos.")

if __name__ == "__main__":
    main()
