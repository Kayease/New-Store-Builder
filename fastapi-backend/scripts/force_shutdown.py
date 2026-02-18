
import os
import subprocess
import time

def kill_backend_processes():
    print("--- Aggressive Cleanup of Backend Processes ---")
    
    # 1. Kill uvicorn specifically
    print("Killing uvicorn.exe...")
    os.system("taskkill /F /IM uvicorn.exe")
    
    # 2. Find python processes running 'app.main' or 'uvicorn'
    # WMI query to find command lines (Windows specific)
    print("Scanning for Python uvicorn processes...")
    try:
        # Use wmic to get process id and command line
        # This is safer than killing all python.exe
        cmd = 'wmic process where "name=\'python.exe\'" get commandline,processid'
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
        out, err = proc.communicate()
        
        output = out.decode('utf-8', errors='ignore')
        lines = output.split('\r\n')
        
        for line in lines:
            if 'uvicorn' in line or 'app.main' in line:
                parts = line.strip().split()
                if parts:
                    pid = parts[-1] 
                    if pid.isdigit():
                        print(f"Found Uvicorn Python PID: {pid}. Killing...")
                        os.system(f"taskkill /F /PID {pid}")
    except Exception as e:
        print(f"Error scanning wmic: {e}")
        
    print("Cleanup complete.")

if __name__ == "__main__":
    kill_backend_processes()
