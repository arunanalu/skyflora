import csv
import json
import time
import urllib.request
import urllib.parse
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

# CONFIGURAÇÕES
START_DATE = "2024-01-01"
CSV_FILENAME = "tabela_votacoes_ambientais.csv"
MAX_WORKERS = 10  # Número de requisições simultâneas

# TERMOS AMBIENTAIS SOLICITADOS
ENVIRONMENTAL_TERMS = [
    "meio ambiente", "ambiental", "biodiversidade", "Amazônia", "floresta",
    "desmatamento", "mudanças climáticas", "clima", "sustentabilidade",
    "licenciamento ambiental", "fauna", "flora", "queimadas",
    "conservação ambiental", "preservação ambiental", "recursos hídricos",
    "energia renovável", "resíduos sólidos"
]

# Cache global para deputados
deputados_cache = {}
cache_lock = threading.Lock()

# Lock para o arquivo de saída / logs
print_lock = threading.Lock()

def normalize_text(text):
    """Remove acentos e coloca em minúsculas para busca insensível a acentuação."""
    if not text:
        return ""
    nfkd_form = unicodedata.normalize('NFKD', text.lower())
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])

ENVIRONMENTAL_TERMS_NORM = [normalize_text(t) for t in ENVIRONMENTAL_TERMS]

def http_get(url):
    """Realiza uma requisição GET HTTP com retry em caso de erro 429."""
    headers = {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    req = urllib.request.Request(url, headers=headers)
    
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                if response.status == 200:
                    return json.loads(response.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            if e.code == 429:
                sleep_time = 2 ** attempt
                with print_lock:
                    print(f"[Aviso] Rate limit (429) em {url}. Aguardando {sleep_time}s...")
                time.sleep(sleep_time)
                continue
            elif e.code == 404:
                return None
            with print_lock:
                print(f"[Erro] HTTP {e.code} para {url}")
            return None
        except Exception as e:
            if attempt == 4:
                with print_lock:
                    print(f"[Erro] Falha na conexão com {url}: {e}")
                return None
            time.sleep(1)
    return None

def fetch_deputies_cache():
    """Obtém e faz o cache dos deputados da 57ª legislatura."""
    print("Carregando deputados da legislatura atual (57)...")
    url = "https://dadosabertos.camara.leg.br/api/v2/deputados?idLegislatura=57&itens=100"
    count = 0
    while url:
        res = http_get(url)
        if not res or 'dados' not in res:
            break
        for dep in res['dados']:
            deputados_cache[dep['id']] = {
                'nome': dep['nome'],
                'partido': dep['siglaPartido'],
                'uf': dep['siglaUf']
            }
            count += 1
        
        # Próxima página
        next_url = None
        for link in res.get('links', []):
            if link.get('rel') == 'next':
                next_url = link.get('href')
                break
        url = next_url
    print(f"Cache de deputados carregado com {count} registros.")

def get_deputy_info(dep_id, fallback_name=None):
    """Retorna informações do deputado (nome, partido, uf), consultando a API se necessário."""
    with cache_lock:
        if dep_id in deputados_cache:
            return deputados_cache[dep_id]
            
    # Se não estiver no cache (ex: de legislaturas anteriores)
    url = f"https://dadosabertos.camara.leg.br/api/v2/deputados/{dep_id}"
    res = http_get(url)
    if res and 'dados' in res:
        d = res['dados']
        status = d.get('ultimoStatus', {})
        info = {
            'nome': status.get('nome') or d.get('nomeCivil') or fallback_name,
            'partido': status.get('siglaPartido') or "S/Partido",
            'uf': status.get('siglaUf') or "N/A"
        }
        with cache_lock:
            deputados_cache[dep_id] = info
        return info
    
    return {
        'nome': fallback_name or f"Deputado ID {dep_id}",
        'partido': "N/A",
        'uf': "N/A"
    }

def has_env_keyword(text):
    """Verifica se o texto contém algum dos termos ambientais."""
    if not text:
        return False
    text_norm = normalize_text(text)
    for kw_norm in ENVIRONMENTAL_TERMS_NORM:
        if kw_norm in text_norm:
            return True
    return False

def fetch_propositions():
    """Busca proposições ambientais a partir da data de início."""
    proposicoes = {}
    
    # 1. Buscar pelo Tema 48 (Meio Ambiente)
    print(f"Buscando proposições com o tema Meio Ambiente (codTema=48) desde {START_DATE}...")
    url = f"https://dadosabertos.camara.leg.br/api/v2/proposicoes?codTema=48&dataApresentacaoInicio={START_DATE}&itens=100"
    while url:
        res = http_get(url)
        if not res or 'dados' not in res:
            break
        for prop in res['dados']:
            # Pré-filtragem por ementa para evitar detalhar proposições irrelevantes
            ementa = prop.get('ementa') or ""
            if has_env_keyword(ementa):
                proposicoes[prop['id']] = prop
        
        next_url = None
        for link in res.get('links', []):
            if link.get('rel') == 'next':
                next_url = link.get('href')
                break
        url = next_url
        
    print(f"Total pré-filtrado por tema: {len(proposicoes)} proposições.")
    
    # 2. Buscar por cada palavra-chave na API (retorna itens pré-filtrados pela API)
    print(f"Buscando proposições contendo termos específicos via parâmetro de busca...")
    for kw in ENVIRONMENTAL_TERMS:
        encoded_kw = urllib.parse.quote(kw)
        url = f"https://dadosabertos.camara.leg.br/api/v2/proposicoes?keywords={encoded_kw}&dataApresentacaoInicio={START_DATE}&itens=100"
        kw_count = 0
        while url:
            res = http_get(url)
            if not res or 'dados' not in res:
                break
            for prop in res['dados']:
                if prop['id'] not in proposicoes:
                    # Garantir que a ementa ou palavra-chave realmente contenha o termo
                    proposicoes[prop['id']] = prop
                    kw_count += 1
            
            next_url = None
            for link in res.get('links', []):
                if link.get('rel') == 'next':
                    next_url = link.get('href')
                    break
            url = next_url
        if kw_count > 0:
            print(f"  Adicionadas {kw_count} proposições únicas com termo '{kw}'.")
            
    print(f"Total acumulado após buscas textuais: {len(proposicoes)} proposições.")
    return proposicoes

def process_single_proposition(prop_summary):
    """Processa detalhes, autores, temas, e votos de uma única proposição."""
    prop_id = prop_summary['id']
    
    # 1. Obter detalhamento
    url_det = f"https://dadosabertos.camara.leg.br/api/v2/proposicoes/{prop_id}"
    res_det = http_get(url_det)
    if not res_det or 'dados' not in res_det:
        return []
    
    prop = res_det['dados']
    
    # 2. Obter temas
    url_temas = f"https://dadosabertos.camara.leg.br/api/v2/proposicoes/{prop_id}/temas"
    res_temas = http_get(url_temas)
    temas_list = res_temas.get('dados', []) if res_temas else []
    
    # Textos para validação dos termos ambientais
    ementa = prop.get('ementa') or ""
    keywords_field = prop.get('keywords') or ""
    ementa_det = prop.get('ementaDetalhada') or ""
    justificativa = prop.get('justificativa') or ""
    temas_str = ", ".join([t.get('tema', '') for t in temas_list])
    
    combined_text = " ".join([ementa, keywords_field, ementa_det, justificativa, temas_str])
    combined_text_norm = normalize_text(combined_text)
    
    # Identificar termos que bateram
    matched_terms = []
    for term, norm_term in zip(ENVIRONMENTAL_TERMS, ENVIRONMENTAL_TERMS_NORM):
        if norm_term in combined_text_norm:
            matched_terms.append(term)
            
    # Se não bateu nenhum termo de meio ambiente (e não está explicitamente sob tema 48), desconsideramos
    is_env_theme = any(t.get('codTema') == 48 for t in temas_list)
    if not matched_terms and not is_env_theme:
        return []
        
    tema_identificado = ", ".join(matched_terms) if matched_terms else "Meio Ambiente (Tema Geral)"
    
    # 3. Obter autores
    url_autores = f"https://dadosabertos.camara.leg.br/api/v2/proposicoes/{prop_id}/autores"
    res_autores = http_get(url_autores)
    if not res_autores or 'dados' not in res_autores:
        return []
        
    autores_deputados = []
    for aut in res_autores['dados']:
        # Se for deputado
        if aut.get('tipo') == 'Deputado(a)' or (aut.get('uri') and '/deputados/' in aut.get('uri')):
            try:
                dep_id = int(aut.get('uri').split('/')[-1])
                autores_deputados.append((dep_id, aut.get('nome')))
            except Exception:
                continue
                
    if not autores_deputados:
        return [] # Sem deputados como autores
        
    # 4. Obter votações vinculadas
    url_votacoes = f"https://dadosabertos.camara.leg.br/api/v2/proposicoes/{prop_id}/votacoes"
    res_votacoes = http_get(url_votacoes)
    votacoes = res_votacoes.get('dados', []) if res_votacoes else []
    
    rows = []
    
    # Links
    link_oficial = f"https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao={prop_id}"
    link_inteiro_teor = prop.get('urlInteiroTeor') or "N/A"
    
    data_apresentacao = prop.get('dataApresentacao')
    data_apres_format = data_apresentacao[:10] if data_apresentacao else "N/A"
    
    status = prop.get('statusProposicao', {})
    situacao_atual = status.get('descricaoSituacao') or status.get('descricaoTramitacao') or "N/A"
    
    tipo_prop = prop.get('siglaTipo') or "N/A"
    num_ano = f"{prop.get('numero')}/{prop.get('ano')}"
    
    if not votacoes:
        # Se não há votações registradas, gerar uma linha por deputado com N/A
        for dep_id, name in autores_deputados:
            dep_info = get_deputy_info(dep_id, name)
            rows.append({
                'deputado_nome': dep_info['nome'],
                'deputado_partido': dep_info['partido'],
                'deputado_uf': dep_info['uf'],
                'tipo_proposicao': tipo_prop,
                'numero_ano': num_ano,
                'ementa': ementa,
                'tema_ambiental': tema_identificado,
                'data_apresentacao': data_apres_format,
                'situacao_atual': situacao_atual,
                'resultado_votacao': "Sem votação nominal registrada",
                'voto_deputado': "N/A",
                'link_oficial': link_oficial,
                'link_inteiro_teor': link_inteiro_teor
            })
    else:
        # Para cada votação nominal
        for vot in votacoes:
            vot_id = vot['id']
            # Buscar os votos desta votação
            url_votos = f"https://dadosabertos.camara.leg.br/api/v2/votacoes/{vot_id}/votos"
            res_votos = http_get(url_votos)
            votos_list = res_votos.get('dados', []) if res_votos else []
            
            # Mapear votos da votação por deputado_id
            votos_map = {}
            for v_item in votos_list:
                d_item = v_item.get('deputado_')
                if d_item and d_item.get('id'):
                    votos_map[d_item['id']] = v_item.get('tipoVoto')
            
            # Resultado da votação
            aprovacao = vot.get('aprovacao')
            if aprovacao == 1:
                resultado_str = "Aprovado"
            elif aprovacao == 0:
                resultado_str = "Rejeitado"
            else:
                resultado_str = vot.get('descricao') or "N/A"
                
            # Limitar tamanho do resultado no CSV
            if len(resultado_str) > 200:
                resultado_str = resultado_str[:197] + "..."
                
            for dep_id, name in autores_deputados:
                dep_info = get_deputy_info(dep_id, name)
                
                # Voto do deputado
                if not votos_list:
                    # Se não veio votos na lista, a votação foi simbólica ou sem voto nominal registrado
                    voto_str = "Votação Simbólica"
                else:
                    voto_str = votos_map.get(dep_id, "Não votou/Ausente")
                    
                rows.append({
                    'deputado_nome': dep_info['nome'],
                    'deputado_partido': dep_info['partido'],
                    'deputado_uf': dep_info['uf'],
                    'tipo_proposicao': tipo_prop,
                    'numero_ano': num_ano,
                    'ementa': ementa,
                    'tema_ambiental': tema_identificado,
                    'data_apresentacao': data_apres_format,
                    'situacao_atual': situacao_atual,
                    'resultado_votacao': f"{resultado_str} (ID Votação: {vot_id})",
                    'voto_deputado': voto_str,
                    'link_oficial': link_oficial,
                    'link_inteiro_teor': link_inteiro_teor
                })
                
    return rows

def main():
    start_time = time.time()
    
    # 1. Carregar cache de deputados
    fetch_deputies_cache()
    
    # 2. Obter proposições elegíveis
    proposicoes_dict = fetch_propositions()
    total_props = len(proposicoes_dict)
    
    if not total_props:
        print("Nenhuma proposição encontrada no período. Encerrando.")
        return
        
    print(f"Iniciando detalhamento e filtragem de {total_props} proposições...")
    
    final_rows = []
    processed_count = 0
    
    # Processar em paralelo com ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(process_single_proposition, prop): prop 
            for prop in proposicoes_dict.values()
        }
        
        for future in as_completed(futures):
            processed_count += 1
            if processed_count % 50 == 0 or processed_count == total_props:
                print(f"Progresso: {processed_count}/{total_props} proposições processadas...")
            
            try:
                res_rows = future.result()
                final_rows.extend(res_rows)
            except Exception as e:
                prop = futures[future]
                print(f"[Erro] Falha ao processar proposição {prop['id']}: {e}")
                
    print(f"Processamento concluído. {len(final_rows)} registros gerados para a tabela.")
    
    # Escrever no arquivo CSV
    headers = [
        "Nome do Deputado", "Partido", "UF", "Tipo da proposição", "Número/Ano",
        "Ementa", "Tema ambiental identificado", "Data de apresentação",
        "Situação atual", "Resultado da votação", "Voto do deputado",
        "Link oficial da proposição", "Link do inteiro teor"
    ]
    
    print(f"Escrevendo dados no arquivo {CSV_FILENAME}...")
    with open(CSV_FILENAME, mode='w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        
        for row in final_rows:
            writer.writerow([
                row['deputado_nome'],
                row['deputado_partido'],
                row['deputado_uf'],
                row['tipo_proposicao'],
                row['numero_ano'],
                row['ementa'],
                row['tema_ambiental'],
                row['data_apresentacao'],
                row['situacao_atual'],
                row['resultado_votacao'],
                row['voto_deputado'],
                row['link_oficial'],
                row['link_inteiro_teor']
            ])
            
    elapsed_time = time.time() - start_time
    print(f"Sucesso! Arquivo '{CSV_FILENAME}' criado.")
    print(f"Tempo total gasto: {elapsed_time:.2f} segundos.")

if __name__ == "__main__":
    main()
