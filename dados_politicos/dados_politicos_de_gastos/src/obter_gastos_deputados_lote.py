import csv
import io
import os
import zipfile
import urllib.request
import time

# Configurações
ANOS = [2023, 2024, 2025, 2026]
OUTPUT_CSV = "gastos_deputados_consolidado.csv"
TEMP_DIR = "temp_cotas"

def download_and_extract_csv(ano):
    """Baixa o ZIP da cota para o ano especificado e extrai o CSV correspondente."""
    url = f"https://www.camara.leg.br/cotas/Ano-{ano}.csv.zip"
    zip_path = os.path.join(TEMP_DIR, f"Ano-{ano}.csv.zip")
    
    print(f"Baixando dados de gastos do ano {ano} de: {url}...")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    req = urllib.request.Request(url, headers=headers)
    
    try:
        # Fazer download
        with urllib.request.urlopen(req) as response:
            content = response.read()
            with open(zip_path, 'wb') as f:
                f.write(content)
        
        # Extrair ZIP
        print(f"Extraindo dados do ano {ano}...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # Encontrar o arquivo CSV dentro do ZIP
            csv_files = [f for f in zip_ref.namelist() if f.endswith('.csv')]
            if not csv_files:
                print(f"[Erro] Nenhum CSV encontrado no ZIP de {ano}")
                return None
            
            csv_filename = csv_files[0]
            zip_ref.extract(csv_filename, TEMP_DIR)
            return os.path.join(TEMP_DIR, csv_filename)
            
    except Exception as e:
        print(f"[Erro] Falha ao processar o ano {ano}: {e}")
        return None

def process_csv_file(csv_path, writer):
    """Lê o CSV original da Câmara (ponto e vírgula, codificação variável) e grava no consolidado."""
    if not csv_path or not os.path.exists(csv_path):
        return 0
    
    # Tenta abrir com utf-8-sig e depois iso-8859-1 (Latin-1) se falhar
    encodings = ['utf-8-sig', 'iso-8859-1', 'utf-8', 'cp1252']
    file_handle = None
    
    for encoding in encodings:
        try:
            # Teste rápido de leitura
            with open(csv_path, 'r', encoding=encoding) as f:
                f.readline()
            file_handle = open(csv_path, 'r', encoding=encoding)
            # print(f"Lendo {csv_path} usando codificação: {encoding}")
            break
        except (UnicodeDecodeError, LookupError):
            continue
            
    if not file_handle:
        print(f"[Erro] Não foi possível ler o arquivo {csv_path} com nenhuma codificação conhecida.")
        return 0
        
    try:
        # Os arquivos CSV da Câmara usam ponto e vírgula como delimitador
        reader = csv.DictReader(file_handle, delimiter=';')
        
        # Mapeamento de colunas desejadas (CSV original -> Nosso CSV consolidado)
        # O arquivo original tem aspas duplas adicionais em torno de cabeçalhos e valores.
        # DictReader remove as aspas dos nomes das chaves automaticamente se bem configurado,
        # mas vamos higienizar as chaves para garantir compatibilidade.
        
        rows_written = 0
        buffer_rows = []
        
        # Mapeamento seguro de nomes de colunas
        # Algumas versões antigas ou formatos podem variar ligeiramente, tratamos as variações mais comuns
        for row in reader:
            # Higienizar as chaves do dicionário (remover aspas extras e espaços)
            cleaned_row = {k.strip('"').strip(): v for k, v in row.items() if k is not None}
            
            # Obter campos com fallbacks para variações de nomes
            dep_id = cleaned_row.get('ideCadastro') or cleaned_row.get('idecadastro') or ""
            dep_name = cleaned_row.get('txNomeParlamentar') or cleaned_row.get('txnomeparlamentar') or ""
            dep_party = cleaned_row.get('sgPartido') or cleaned_row.get('sgpartido') or ""
            dep_uf = cleaned_row.get('sgUF') or cleaned_row.get('sguf') or ""
            
            ano = cleaned_row.get('numAno') or cleaned_row.get('numano') or ""
            mes = cleaned_row.get('numMes') or cleaned_row.get('nummes') or ""
            
            # Tratamento da data de emissão do gasto
            raw_date = cleaned_row.get('datEmissao') or cleaned_row.get('datemissao') or ""
            # Geralmente vem no formato '2024-05-15T00:00:00'
            date_only = raw_date[:10] if raw_date else ""
            
            tipo_despesa = cleaned_row.get('txtDescricao') or cleaned_row.get('txtdescricao') or ""
            valor_documento = cleaned_row.get('vlrDocumento') or cleaned_row.get('vlrdocumento') or ""
            valor_liquido = cleaned_row.get('vlrLiquido') or cleaned_row.get('vlrliquido') or ""
            fornecedor = cleaned_row.get('txtFornecedor') or cleaned_row.get('txtfornecedor') or ""
            cnpj_cpf = cleaned_row.get('txtCNPJCPF') or cleaned_row.get('txtcnpjcpf') or ""
            
            # Se não houver nome de parlamentar, ignorar (ex: liderança partidária ou despesa de comissão)
            if not dep_name:
                continue
                
            buffer_rows.append([
                dep_id, dep_name, dep_party, dep_uf,
                ano, mes, date_only, tipo_despesa,
                valor_documento, valor_liquido, fornecedor, cnpj_cpf
            ])
            
            # Gravar em blocos para performance
            if len(buffer_rows) >= 5000:
                writer.writerows(buffer_rows)
                rows_written += len(buffer_rows)
                buffer_rows = []
                
        if buffer_rows:
            writer.writerows(buffer_rows)
            rows_written += len(buffer_rows)
            
        return rows_written
        
    finally:
        file_handle.close()

def main():
    start_time = time.time()
    
    # Criar pasta temporária se não existir
    os.makedirs(TEMP_DIR, exist_ok=True)
    
    # Cabeçalho do arquivo unificado de saída
    headers = [
        'deputado_id', 'deputado_nome', 'deputado_partido', 'deputado_uf',
        'ano', 'mes', 'data_gasto', 'tipo_despesa', 'valor_documento',
        'valor_liquido', 'fornecedor_nome', 'fornecedor_cnpj_cpf'
    ]
    
    print(f"Criando arquivo consolidado de saída: {OUTPUT_CSV}...")
    
    total_records = 0
    with open(OUTPUT_CSV, mode='w', newline='', encoding='utf-8-sig') as output_file:
        writer = csv.writer(output_file)
        writer.writerow(headers)
        
        for ano in ANOS:
            csv_path = download_and_extract_csv(ano)
            if csv_path:
                print(f"Processando e limpando dados de {ano}...")
                records_count = process_csv_file(csv_path, writer)
                total_records += records_count
                print(f"Ano {ano}: {records_count:,} registros adicionados.")
                
                # Remover o CSV extraído para economizar espaço
                try:
                    os.remove(csv_path)
                except Exception:
                    pass
            
            # Remover o arquivo ZIP temporário
            zip_path = os.path.join(TEMP_DIR, f"Ano-{ano}.csv.zip")
            if os.path.exists(zip_path):
                try:
                    os.remove(zip_path)
                except Exception:
                    pass
                    
    # Limpar pasta temporária
    try:
        os.rmdir(TEMP_DIR)
    except Exception:
        pass
        
    duration = time.time() - start_time
    print(f"\nExtração concluída com sucesso!")
    print(f"Total de registros de despesas unificados: {total_records:,}")
    print(f"Dados consolidados salvos em: {OUTPUT_CSV}")
    print(f"Tempo total de execução: {duration:.2f} segundos.")

if __name__ == "__main__":
    main()
