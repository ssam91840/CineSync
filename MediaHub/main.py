import argparse
import subprocess
import os
import sys
import platform
import time
import psutil
import signal
import socket
import psutil

# Append the parent directory to the system path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Local imports from MediaHub
from MediaHub.config.config import *
from MediaHub.utils.logging_utils import log_message
from MediaHub.processors.db_utils import *
from MediaHub.processors.symlink_creator import *
from MediaHub.monitor.polling_monitor import *
from MediaHub.processors.symlink_utils import *

db_initialized = False

POLLING_MONITOR_PATH = os.path.join(os.path.dirname(__file__), 'monitor', 'polling_monitor.py')
LOCK_FILE = '/tmp/polling_monitor.lock' if platform.system() != 'Windows' else 'C:\\temp\\polling_monitor.lock'
MONITOR_PID_FILE = '/tmp/monitor_pid.txt' if platform.system() != 'Windows' else 'C:\\temp\\monitor_pid.txt'
LOCK_TIMEOUT = 3600

# Set up global variables to track processes
background_processes = []
terminate_flag = threading.Event()

# Load .env file from the parent directory
dotenv_path = find_dotenv('../.env')
if not dotenv_path:
    print(RED_COLOR + "Error: .env file not found in the parent directory." + RESET_COLOR)
    exit(1)

load_dotenv(dotenv_path)

def wait_for_mount():
    """Wait for the rclone mount to become available with minimal logging."""
    initial_message = True
    while True:
        if check_rclone_mount():
            if initial_message:
                log_message("Mount is now available.", level="INFO")
            return True

        if initial_message:
            log_message(f"Waiting for mount directory to become available...", level="INFO")
            initial_message = False

        time.sleep(is_mount_check_interval())

def initialize_db_with_mount_check():
    """Initialize database after ensuring mount is available."""
    global db_initialized

    if not db_initialized:

        if is_rclone_mount_enabled():
            wait_for_mount()

        initialize_db()
        db_initialized = True

def display_missing_files_with_mount_check(dest_dir):
    """Display missing files after ensuring mount is available."""

    if is_rclone_mount_enabled():
        wait_for_mount()

    display_missing_files(dest_dir)

def ensure_windows_temp_directory():
    """Create the C:\\temp directory if it does not exist on Windows."""
    if platform.system() == 'Windows':
        temp_dir = 'C:\\temp'
        if not os.path.exists(temp_dir):
            try:
                os.makedirs(temp_dir)
                log_message(f"Created directory: {temp_dir}", level="INFO")
            except OSError as e:
                log_message(f"Error creating directory {temp_dir}: {e}", level="ERROR")
                exit(1)

def is_process_running(pid):
    """Check if a process with a given PID is still running."""
    try:
        return psutil.pid_exists(pid) and psutil.Process(pid).is_running()
    except psutil.NoSuchProcess:
        return False

def create_lock_file():
    """Create the lock file and write the process ID and timestamp."""
    with open(LOCK_FILE, 'w') as lock_file:
        lock_file.write(f"{os.getpid()}\n")
        lock_file.write(f"{time.time()}\n")

def check_lock_file():
    """Check if a lock file exists and whether it's stale or the process is still running."""
    if os.path.exists(LOCK_FILE):
        try:
            with open(LOCK_FILE, 'r') as lock_file:
                pid = int(lock_file.readline().strip())
                lock_time = float(lock_file.readline().strip())

                # Check if the process is still running
                if is_process_running(pid):
                    return True

                # Check if the lock file is too old (stale)
                if time.time() - lock_time > LOCK_TIMEOUT:
                    log_message(f"Stale lock file found. Removing lock.", level="WARNING")
                    os.remove(LOCK_FILE)
                else:
                    log_message(f"Lock file exists but process not running. Removing lock.", level="WARNING")
                    os.remove(LOCK_FILE)
        except (OSError, ValueError):
            log_message(f"Error reading lock file. Removing lock.", level="ERROR")
            os.remove(LOCK_FILE)
    return False

def remove_lock_file():
    """Remove the lock file."""
    if os.path.exists(LOCK_FILE):
        try:
            os.remove(LOCK_FILE)
            log_message("Lock file removed successfully.", level="DEBUG")
        except Exception as e:
            log_message(f"Error removing lock file: {e}", level="ERROR")

    if os.path.exists(MONITOR_PID_FILE):
        try:
            os.remove(MONITOR_PID_FILE)
        except Exception as e:
            log_message(f"Error removing monitor PID file: {e}", level="ERROR")

def terminate_subprocesses():
    """Terminate all subprocesses started by this script."""
    global background_processes
    log_message("Terminating all background processes...", level="INFO")

    # First, check monitor pid file
    if os.path.exists(MONITOR_PID_FILE):
        try:
            with open(MONITOR_PID_FILE, 'r') as f:
                pid = int(f.read().strip())

            if psutil.pid_exists(pid):
                proc = psutil.Process(pid)
                try:
                    log_message(f"Terminating monitor process with PID {pid}", level="INFO")
                    proc.terminate()
                    proc.wait(timeout=3)
                except (psutil.NoSuchProcess, psutil.TimeoutExpired):
                    try:
                        log_message(f"Force killing monitor process with PID {pid}", level="WARNING")
                        proc.kill()
                    except psutil.NoSuchProcess:
                        pass
        except Exception as e:
            log_message(f"Error terminating monitor process: {e}", level="ERROR")

    # Handle tracked processes
    for process in background_processes:
        try:
            if process.poll() is None:
                log_message(f"Terminating process with PID {process.pid}", level="INFO")
                if platform.system() == 'Windows':
                    # On Windows, use taskkill to force terminate the process tree
                    subprocess.run(['taskkill', '/F', '/T', '/PID', str(process.pid)],
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    process.terminate()
                    try:
                        process.wait(timeout=3)
                    except subprocess.TimeoutExpired:
                        process.kill()
        except Exception as e:
            log_message(f"Error terminating process: {e}", level="ERROR")

    # Try to terminate child processes using psutil
    try:
        current_process = psutil.Process(os.getpid())
        children = current_process.children(recursive=True)

        # First try to terminate gracefully
        for child in children:
            try:
                log_message(f"Terminating child process {child.pid}", level="INFO")
                child.terminate()
            except psutil.NoSuchProcess:
                continue

        gone, still_alive = psutil.wait_procs(children, timeout=3)

        for child in still_alive:
            try:
                log_message(f"Force killing child process {child.pid}", level="WARNING")
                child.kill()
            except psutil.NoSuchProcess:
                pass
    except Exception as e:
        log_message(f"Error while terminating child processes: {str(e)}", level="ERROR")

def handle_exit(signum, frame):
    """Handle script termination and clean up."""
    log_message("Received shutdown signal, exiting gracefully", level="INFO")
    log_message("Terminating process and cleaning up lock file.", level="INFO")

    terminate_flag.set()
    terminate_subprocesses()
    remove_lock_file()
    os._exit(0)

def setup_signal_handlers():
    """Setup signal handlers for Linux and Windows."""
    # Register handlers for both Windows and Unix signals
    signal.signal(signal.SIGINT, handle_exit)
    if platform.system() == 'Windows':
        signal.signal(signal.SIGBREAK, handle_exit)
    else:
        signal.signal(signal.SIGTERM, handle_exit)

def start_polling_monitor():
    """Start the polling monitor as a subprocess and track its PID."""
    global background_processes

    if check_lock_file():
        return

    create_lock_file()

    log_message("Processing complete. Setting up directory monitoring.", level="INFO")

    try:
        python_command = 'python' if platform.system() == 'Windows' else 'python3'
        process = subprocess.Popen([python_command, POLLING_MONITOR_PATH])
        background_processes.append(process)

        with open(MONITOR_PID_FILE, 'w') as f:
            f.write(str(process.pid))

        log_message(f"Started polling monitor with PID {process.pid}", level="INFO")

        while not terminate_flag.is_set():
            if process.poll() is not None:
                log_message(f"Polling monitor exited with code {process.returncode}", level="INFO")
                break
            time.sleep(1)

    except Exception as e:
        log_message(f"Error running monitor script: {e}", level="ERROR")
    finally:
        remove_lock_file()

def parse_season_episode(season_episode):
    """Parse season and episode numbers from the format SxxExx."""
    if not season_episode:
        return None, None

    match = re.match(r'S(\d{1,2})E(\d{1,3})', season_episode.upper())
    if match:
        return int(match.group(1)), int(match.group(2))
    return None, None

# CineSync WebDAV
def is_port_in_use(port):
    """Check if a port is already in use using multiple methods."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            s.bind(('0.0.0.0', port))
            return False
    except socket.error:
        pass

    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            result = s.connect_ex(('127.0.0.1', port))
            if result == 0:
                return True
    except:
        pass

    try:
        for conn in psutil.net_connections(kind='inet'):
            if conn.laddr.port == port and conn.status == 'LISTEN':
                return True
    except:
        pass

    return False

def start_webdav_server():
    """Start WebDavHub server if enabled."""
    global background_processes

    if cinesync_webdav():
        webdav_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'WebDavHub')
        if platform.system() == 'Windows':
            webdav_script = os.path.join(webdav_dir, 'cinesync.exe')
        else:
            webdav_script = os.path.join(webdav_dir, 'cinesync')
        webdav_port = int(os.getenv('WEBDAV_PORT'))

        # Check if the WebDAV server is already running on the specified port
        if is_port_in_use(webdav_port):
            log_message(f"WebDavHub server is already running on port {webdav_port}", level="INFO")
            return

        if os.path.exists(webdav_script):
            log_message("Starting WebDavHub server...", level="INFO")

            try:
                # Change to the WebDavHub directory and execute the script
                current_dir = os.getcwd()
                os.chdir(webdav_dir)
                webdav_process = subprocess.Popen(["./" + os.path.basename(webdav_script)])
                background_processes.append(webdav_process)
                os.chdir(current_dir)

                log_message(f"WebDavHub server started with PID: {webdav_process.pid}", level="INFO")
            except Exception as e:
                log_message(f"Failed to start WebDavHub server: {e}", level="ERROR")
        else:
            log_message(f"WebDavHub executable not found at: {webdav_script}", level="ERROR")

def main(dest_dir):
    parser = argparse.ArgumentParser(description="Create symlinks for files from src_dirs in dest_dir.")
    parser.add_argument("--auto-select", action="store_true", help="Automatically chooses the first option without prompting the user")
    parser.add_argument("single_path", nargs="?", help="Single path to process instead of using SOURCE_DIRS from environment variables")
    parser.add_argument("--force", action="store_true", help="Force recreate symlinks even if they already exist")
    parser.add_argument("--force-show", action="store_true", help="Force process file as a TV show regardless of naming pattern")
    parser.add_argument("--force-movie", action="store_true", help="Force process file as a movie regardless of naming pattern")
    parser.add_argument("--force-extra", action="store_true", help="Force an extra file to be considered as a Movie/Show")
    parser.add_argument("--disable-monitor", action="store_true", help="Disable polling monitor and symlink cleanup processes")
    parser.add_argument("--imdb", type=str, help="Direct IMDb ID for the show")
    parser.add_argument("--tmdb", type=int, help="Direct TMDb ID for the show")
    parser.add_argument("--tvdb", type=int, help="Direct TVDb ID for the show")
    parser.add_argument("--season-episode", type=str, help="Specify season and episode numbers in format SxxExx (e.g., S03E15)")
    parser.add_argument("--skip", action="store_true", help="Skip processing the file and mark it as 'Skipped by user' in the database")

    db_group = parser.add_argument_group('Database Management')
    db_group.add_argument("--reset", action="store_true",
                         help="Reset the database to its initial state")
    db_group.add_argument("--status", action="store_true",
                         help="Display database statistics")
    db_group.add_argument("--vacuum", action="store_true",
                         help="Perform database vacuum to optimize storage and performance")
    db_group.add_argument("--verify", action="store_true",
                         help="Verify database integrity and check for corruption")
    db_group.add_argument("--export", metavar="FILE",
                         help="Export database contents to a CSV file")
    db_group.add_argument("--import", metavar="FILE", dest="import_file",
                         help="Import database contents from a CSV file")
    db_group.add_argument("--search", metavar="PATTERN",
                         help="Search for files in database matching the given pattern")
    db_group.add_argument("--optimize", action="store_true",
                         help="Optimize database indexes and analyze tables")

    args = parser.parse_args()

    # Parse season and episode numbers if provided
    season_number, episode_number = parse_season_episode(args.season_episode)


    # Ensure --force-show and --force-movie aren't used together
    if args.force_show and args.force_movie:
        log_message("Error: Cannot use --force-show and --force-movie together", level="ERROR")
        exit(1)

    if args.vacuum:
        vacuum_database()
        return

    if args.verify:
        verify_database_integrity()
        return

    if args.export:
        export_database(args.export)
        return

    if args.import_file:
        import_database(args.import_file)
        return

    if args.search:
        search_database(args.search)
        return

    if args.optimize:
        optimize_database()
        return

    if args.reset:
        if input("Are you sure you want to reset the database? This will delete all entries. (Y/N): ").lower() == 'y':
            reset_database()
            return

    if args.status:
        stats = get_database_stats()
        if stats:
            log_message("Database Statistics:", level="INFO")
            log_message(f"Total Records: {stats['total_records']}", level="INFO")
            log_message(f"Archived Records: {stats['archived_records']}", level="INFO")
            log_message(f"Main DB Size: {stats['main_db_size']:.2f} MB", level="INFO")
            log_message(f"Archive DB Size: {stats['archive_db_size']:.2f} MB", level="INFO")
        return

    if not os.path.exists(LOCK_FILE):
        # Wait for mount if needed and initialize database
        initialize_db_with_mount_check()

        if not args.disable_monitor:
            log_message("Starting background processes...", level="INFO")
            log_message("RealTime-Monitoring is enabled", level="INFO")

            # Define the callback function to be called once the background task finishes
            def on_missing_files_check_done():
                log_message("Database import completed.", level="INFO")

            # Function to run the missing files check and call the callback when done
            def display_missing_files_with_callback(dest_dir, callback):
                display_missing_files_with_mount_check(dest_dir)
                callback()

            # Run missing files check in a separate thread
            missing_files_thread = threading.Thread(target=display_missing_files_with_callback, args=(dest_dir, on_missing_files_check_done))
            missing_files_thread.daemon = False
            missing_files_thread.start()

            #Symlink cleanup
            cleanup_thread = threading.Thread(target=run_symlink_cleanup, args=(dest_dir,))
            cleanup_thread.daemon = False
            cleanup_thread.start()
        else:
            log_message("RealTime-Monitoring is disabled", level="INFO")

    src_dirs, dest_dir = get_directories()
    if not src_dirs or not dest_dir:
        log_message("Source or destination directory not set in environment variables.", level="ERROR")
        exit(1)

    # Wait for mount before creating symlinks if needed
    if is_rclone_mount_enabled() and not check_rclone_mount():
        wait_for_mount()
    try:
        # Start RealTime-Monitoring in main thread if not disabled
        if not args.disable_monitor:
            start_webdav_server()
            log_message("Starting RealTime-Monitoring...", level="INFO")
            monitor_thread = threading.Thread(target=start_polling_monitor)
            monitor_thread.daemon = False
            monitor_thread.start()
            time.sleep(2)
            create_symlinks(src_dirs, dest_dir, auto_select=args.auto_select, single_path=args.single_path, force=args.force, mode='create', tmdb_id=args.tmdb, imdb_id=args.imdb, tvdb_id=args.tvdb, force_show=args.force_show, force_movie=args.force_movie, season_number=season_number, episode_number=episode_number, force_extra=args.force_extra, skip=args.skip)
            monitor_thread.join()
        else:
            create_symlinks(src_dirs, dest_dir, auto_select=args.auto_select, single_path=args.single_path, force=args.force, mode='create', tmdb_id=args.tmdb, imdb_id=args.imdb, tvdb_id=args.tvdb, force_show=args.force_show, force_movie=args.force_movie, season_number=season_number, episode_number=episode_number, force_extra=args.force_extra, skip=args.skip)
    except KeyboardInterrupt:
        log_message("Keyboard interrupt received, cleaning up and exiting...", level="INFO")
        terminate_flag.set()
        terminate_subprocesses()
        remove_lock_file()
        sys.exit(0)

if __name__ == "__main__":
    # Make sure temp directory exists on Windows
    ensure_windows_temp_directory()

    # Set up signal handlers before anything else
    setup_signal_handlers()

    # Get directories and start main process
    src_dirs, dest_dir = get_directories()

    try:
        main(dest_dir)
    except KeyboardInterrupt:
        log_message("Keyboard interrupt received, cleaning up and exiting...", level="INFO")
        terminate_flag.set()
        terminate_subprocesses()
        remove_lock_file()
        sys.exit(0)
    except Exception as e:
        log_message(f"Unhandled exception: {str(e)}", level="ERROR")
        log_message(traceback.format_exc(), level="DEBUG")
        terminate_flag.set()
        terminate_subprocesses()
        remove_lock_file()
        sys.exit(1)
