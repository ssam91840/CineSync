import os
import sys
import requests
from dotenv import load_dotenv
from utils.logging_utils import log_message

api_key = None
api_warning_logged = False
offline_mode = False

# Load .env file
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path)

def get_api_key():
    global api_key, api_warning_logged, offline_mode

    if api_key is not None:
        return api_key

    api_key = os.getenv('TMDB_API_KEY')

    if not api_key or api_key == 'your_tmdb_api_key_here':
        if not api_warning_logged:
            log_message("TMDb API key not found or is a placeholder. TMDb functionality is not enabled. Running in offline mode.", level="WARNING")
            offline_mode = True
            api_warning_logged = True
        return None

    # Validate API key
    if not is_valid_api_key(api_key):
        if not api_warning_logged:
            log_message("Invalid TMDb API key. TMDb functionality may not work as expected. Running in offline mode.", level="WARNING")
            offline_mode = True
            api_warning_logged = True
        return None

    return api_key

def is_valid_api_key(api_key):
    test_url = 'https://api.themoviedb.org/3/configuration?api_key=' + api_key
    try:
        response = requests.get(test_url)
        if response.status_code == 200:
            return True
        else:
            log_message(f"API key validation failed with status code: {response.status_code}", level="WARNING")
            return False
    except requests.RequestException as e:
        log_message(f"API key validation error: {str(e)}", level="WARNING")
        return False

def get_directories():
    src_dirs = os.getenv('SOURCE_DIR')
    dest_dir = os.getenv('DESTINATION_DIR')
    if not src_dirs or not dest_dir:
        log_message("SOURCE_DIRS or DESTINATION_DIR not set in environment variables.", level="ERROR")
        sys.exit(1)
    return src_dirs.split(','), dest_dir

def is_tmdb_folder_id_enabled():
    return os.getenv('TMDB_FOLDER_ID', 'true').lower() in ['true', '1', 'yes']

def is_rename_enabled():
    return os.getenv('RENAME_ENABLED', 'false').lower() in ['true', '1', 'yes']

def is_movie_collection_enabled():
    return os.getenv('MOVIE_COLLECTION_ENABLED', 'false').lower() in ['true', '1', 'yes']

def is_skip_extras_folder_enabled():
    return os.getenv('SKIP_EXTRAS_FOLDER', 'false').lower() in ['true', '1', 'yes']

def is_override_structure_enabled():
    return os.getenv('OVERRIDE_STRUCTURE', 'false').lower() in ['true', '1', 'yes']

def is_maintain_source_dir_enabled():
    return os.getenv('MAINTAIN_SOURCE_DIR', 'false').lower() in ['true', '1', 'yes']
