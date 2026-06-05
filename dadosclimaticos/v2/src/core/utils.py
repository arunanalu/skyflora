import time
import requests
import logging
import functools

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def with_backoff(max_retries=5, base_delay=2, max_delay=60):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            delay = base_delay
            for attempt in range(max_retries):
                try:
                    response = func(*args, **kwargs)
                    if hasattr(response, 'status_code'):
                        if response.status_code in [429, 502, 503, 504]:
                            raise Exception(f"HTTP {response.status_code}")
                    return response
                except Exception as e:
                    if attempt == max_retries - 1:
                        logger.error(f"Max retries reached in {func.__name__}. Error: {e}")
                        raise
                    logger.warning(f"Error {e} in {func.__name__}. Retrying in {delay}s...")
                    time.sleep(delay)
                    delay = min(delay * 2, max_delay)
        return wrapper
    return decorator

@with_backoff()
def safe_get(*args, **kwargs):
    return requests.get(*args, **kwargs)
