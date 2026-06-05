import time
import requests
import logging
import functools

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def with_backoff(max_retries=15, base_delay=5, max_delay=600):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            delay = base_delay
            for attempt in range(max_retries):
                try:
                    response = func(*args, **kwargs)
                    if hasattr(response, 'status_code'):
                        if response.status_code in [429, 502, 503, 504]:
                            if response.status_code == 429:
                                logger.warning(f"Rate Limit 429 excedido em {func.__name__}. Atraso prolongado...")
                                delay = min(delay * 2, 900)  # max 15 min de espera por tentativa
                            raise Exception(f"HTTP {response.status_code}")
                    return response
                except Exception as e:
                    if attempt == max_retries - 1:
                        logger.error(f"Max retries reached in {func.__name__}. Error: {e}")
                        raise
                    logger.warning(f"Error {e} in {func.__name__}. Retrying in {delay}s...")
                    time.sleep(delay)
                    if "429" not in str(e):
                        delay = min(delay * 2, max_delay)
        return wrapper
    return decorator

@with_backoff()
def safe_get(*args, **kwargs):
    return requests.get(*args, **kwargs)
