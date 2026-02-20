from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from typing import Optional, List
from datetime import datetime
from app.core.supabase_client import supabase_admin
from pydantic import BaseModel
import os
import uuid
import zipfile
import shutil
import subprocess
import threading
import re
from pathlib import Path

router = APIRouter()

# Global defaults for AI automation
API_URL = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:8000/api/v1")


# Create uploads directory - outside 'fastapi-backend' folder to prevent uvicorn reloads
# Determine project root safely (one level up from fastapi-backend)
# __file__ is app/api/v1/endpoints/platform_themes.py
# parents: 0=endpoints, 1=v1, 2=api, 3=app, 4=fastapi-backend
PROJECT_ROOT = Path(__file__).resolve().parents[5]
UPLOAD_DIR = PROJECT_ROOT / "uploads" / "themes"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class ApplyThemeRequest(BaseModel):
    store_slug: str
    theme_slug: str

class ThemeResponse(BaseModel):
    id: str
    _id: str
    name: str
    slug: str
    description: Optional[str]
    thumbnail_url: Optional[str]
    thumbnailUrl: Optional[str]
    zip_url: Optional[str]
    buildPath: Optional[str]
    status: str
    created_at: str
    createdAt: str

class ThemeListResponse(BaseModel):
    items: List[ThemeResponse]
    total: int

def map_theme(theme: dict) -> dict:
    theme_id = theme.get("id", "")
    created_at = theme.get("created_at", "")
    if isinstance(created_at, datetime):
        created_at = created_at.isoformat()
    return {
        "id": theme_id,
        "_id": theme_id,
        "name": theme.get("name", ""),
        "slug": theme.get("slug", ""),
        "description": theme.get("description", ""),
        "thumbnailUrl": theme.get("thumbnail_url", ""),
        "buildPath": theme.get("zip_url", ""),
        "status": theme.get("status", "active"),
        "created_at": created_at,
        "createdAt": created_at,
        # Keep snake_case for internal use if needed
        "thumbnail_url": theme.get("thumbnail_url", ""),
        "zip_url": theme.get("zip_url", "")
    }

@router.get("/themes", response_model=ThemeListResponse)
async def list_themes(search: Optional[str] = None):
    """List all uploaded themes."""
    try:
        query = supabase_admin.table("themes").select("*").order("created_at", desc=True)
        response = query.execute()
        themes = response.data or []
        
        if search:
            search = search.lower()
            themes = [t for t in themes if search in t.get("name", "").lower() or search in t.get("slug", "").lower()]
        
        mapped = [map_theme(t) for t in themes]
        return {"items": mapped, "total": len(mapped)}
    except Exception as e:
        print(f"❌ List themes error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/themes/{slug}")
async def get_theme(slug: str):
    """Get a single theme by slug."""
    try:
        response = supabase_admin.table("themes").select("*").eq("slug", slug).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Theme not found")
        return map_theme(response.data)
    except Exception:
        raise HTTPException(status_code=404, detail="Theme not found")

@router.get("/themes/{slug}/logs")
async def get_theme_logs(slug: str):
    """Get the build logs for a theme."""
    log_file = UPLOAD_DIR / slug / "build_log.txt"
    if not log_file.exists():
        return {"logs": "Logs not found or build hasn't started yet."}
    
    try:
        with open(log_file, "r", encoding="utf-8") as f:
            content = f.read()
            # Return last 500 lines to prevent context bloat but allow history
            lines = content.splitlines()[-500:]
            return {"logs": "\n".join(lines)}
    except Exception as e:
        return {"logs": f"Error reading logs: {str(e)}"}

def run_command(cmd: str, cwd: Path, log_file: Optional[Path] = None):
    """Helper to run shell commands and log output in real-time."""
    print(f"🚀 Running: {cmd} in {cwd}")
    if log_file:
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"\n[{datetime.now().strftime('%H:%M:%S')}] $ {cmd}\n")
    
    process = subprocess.Popen(
        cmd,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        cwd=str(cwd),
        bufsize=1,
        universal_newlines=True
    )

    full_output = []
    if process.stdout:
        for line in process.stdout:
            full_output.append(line)
            # Print to console for server logs
            print(line, end="")
            # Pipe to building log file
            if log_file:
                with open(log_file, "a", encoding="utf-8") as f:
                    f.write(line)
    
    process.wait()
    
    if process.returncode != 0:
        error_msg = f"Command failed: {cmd}\nExit code: {process.returncode}"
        if log_file:
             with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"\n❌ {error_msg}\n")
        raise Exception(error_msg)
    
    return "".join(full_output)

def smart_flatten(extract_dir: Path):
    """Recursively flattens nested directories until we reach actual content."""
    for _ in range(3):
        ignore = ["__MACOSX", ".DS_Store", "node_modules", ".next", "package-lock.json", "build", "dist"]
        try:
            items = [i for i in os.listdir(extract_dir) if i not in ignore]
            if len(items) == 1 and os.path.isdir(extract_dir / items[0]) and items[0] not in ["app", "pages", "public", "src", "out"]:
                nested_dir = extract_dir / items[0]
                print(f"📦 Flattening nested theme directory: {items[0]}")
                for item in os.listdir(nested_dir):
                    src = nested_dir / item
                    dest = extract_dir / item
                    if dest.exists():
                        if dest.is_dir(): shutil.rmtree(dest)
                        else: target.unlink()
                    shutil.move(str(src), str(dest))
                try:
                    os.rmdir(nested_dir)
                except:
                    shutil.rmtree(nested_dir)
            else:
                break
        except Exception as e:
            print(f"⚠️ Flattening error: {e}")
            break

async def process_theme_build(slug: str, zip_path: Path, extract_dir: Path):
    """Background task to extract and build the theme with total asset path fixing."""
    log_file = extract_dir / "build_log.txt"
    
    def update_step(step_msg: str, progress: int = 0):
        timestamp = datetime.now().strftime('%H:%M:%S')
        print(f"⌛ [Progress: {progress}%] [{slug}] {step_msg}")
        
        # Write to persistence
        if log_file.parent.exists():
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"\n[{timestamp}] --- {step_msg} ---\n")

        supabase_admin.table("themes").update({
            "description": f"{step_msg} ({progress}%)"
        }).eq("slug", slug).execute()

    try:
        # 1. Extract ZIP file
        update_step("Step 1/4: Unzipping files...", 25)
        # SMART CLEAN: Preserve node_modules to keep builds fast
        if extract_dir.exists():
            for item in extract_dir.iterdir():
                if item.name not in ["node_modules", ".next", "package-lock.json"]:
                    if item.is_dir(): shutil.rmtree(item)
                    else: item.unlink()
        else:
            extract_dir.mkdir(parents=True, exist_ok=True)
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
        
        # 2. Smart Flatten
        smart_flatten(extract_dir)

        is_nextjs = (extract_dir / "package.json").exists()
        
        if is_nextjs:
            update_step("Step 2/4: Optimizing for Platform...", 50)
            
            # Universal Logic Injection
            inject_theme_logic(extract_dir, slug)
            
            # THE MAGIC FIX: Overwrite next.config.js or create a clean one

            # C. Install dependencies
            update_step("Step 3/4: Installing dependencies (3-5 mins)...", 75)
            run_command("npm install --legacy-peer-deps", extract_dir, log_file)

            # D. Run Build
            update_step("Step 4/4: Finalizing & Compiling assets...", 90)
            run_command("npm run build", extract_dir, log_file)

            # E. Verify 'out' directory
            out_dir = extract_dir / "out"
            if not out_dir.exists():
                raise Exception("Build finished but static 'out' directory missing. Please check logs.")
            
            # F. Cleanup node_modules to save space
            if (extract_dir / "node_modules").exists():
                update_step("Cleaning up...", 95)
                shutil.rmtree(extract_dir / "node_modules")
            
        # Final Update: Set status to active
        supabase_admin.table("themes").update({
            "status": "active", 
            "description": f"AI Optimized & Live (Last Build: {datetime.now().strftime('%H:%M')})"
        }).eq("slug", slug).execute()
        print(f"✅ [Progress: 100%] Theme {slug} is now live and stylized!")
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ [Progress: Error] AI Automation Error for {slug}: {error_msg}")
        supabase_admin.table("themes").update({
            "status": "failed", 
            "description": f"AI Error: {error_msg[:100]}"
        }).eq("slug", slug).execute()

        update_step(f"AI Error: {error_msg}", 0)

LOGIN_TEMPLATE = """
"use client";
import { useState, useEffect } from 'react';
import { loginCustomer, API_URL } from '../../lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      let s = params.get('store');
      if (s) {
        sessionStorage.setItem('kx_sticky_store', s);
      } else {
        s = sessionStorage.getItem('kx_sticky_store') || "";
      }
      setSlug(s);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const storeRes = await fetch(`${API_URL}/s/live/${slug}`).then(r => r.json());
      const storeId = storeRes.data?.store?.id;
      if (!storeId) throw new Error("Store identity lost");

      const res = await loginCustomer(slug, email, password);
      if (res.success) {
        localStorage.setItem(`customer_token_${storeId}`, res.token);
        localStorage.setItem(`customer_data_${storeId}`, JSON.stringify(res.customer));
        alert('Login Successful!');
        window.location.href = `../?store=${slug}`;
      } else {
        setError(res.detail || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-500">Sign in to your customer account</p>
        </div>
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 animate-pulse">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required 
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              placeholder="name@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              required 
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading || !slug}
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-gray-500">
           New here? <a href={`/signup?store=${slug}`} className="text-blue-600 font-bold hover:underline">Create an account</a>
        </p>
      </div>
    </div>
  );
}
"""

SIGNUP_TEMPLATE = """
"use client";
import { useState, useEffect } from 'react';
import { registerCustomer, API_URL } from '../../lib/api';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      let s = params.get('store');
      if (s) {
        sessionStorage.setItem('kx_sticky_store', s);
      } else {
        s = sessionStorage.getItem('kx_sticky_store') || "";
      }
      setSlug(s);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const storeRes = await fetch(`${API_URL}/s/live/${slug}`).then(r => r.json());
      const storeId = storeRes.data?.store?.id;
      if (!storeId) throw new Error("Store identity lost");

      const res = await registerCustomer(slug, name, email, password);
      if (res.success) {
        localStorage.setItem(`customer_token_${storeId}`, res.token);
        localStorage.setItem(`customer_data_${storeId}`, JSON.stringify(res.customer));
        alert('Account Created Successfully!');
        window.location.href = `../?store=${slug}`;
      } else {
        setError(res.detail || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-500">Join our community and start shopping</p>
        </div>
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 animate-pulse">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <input 
              type="text" 
              required 
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              placeholder="John Doe"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required 
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              placeholder="name@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              required 
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading || !slug}
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-gray-500">
           Already have an account? <a href={`/login?store=${slug}`} className="text-blue-600 font-bold hover:underline">Sign in instead</a>
        </p>
      </div>
    </div>
  );
}
"""

def inject_theme_logic(extract_dir: Path, theme_slug: str):
    """Universal Helper to inject Login/Signup logic into any Next.js theme."""
    # 1. Inject API Client with Smart Host Detection
    lib_dir = extract_dir / "lib"
    lib_dir.mkdir(exist_ok=True)
    
    api_url = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:8000/api/v1")
    global API_URL
    API_URL = api_url
    env_content = f"NEXT_PUBLIC_API_URL={api_url}\n"
    (extract_dir / ".env.local").write_text(env_content)
    (extract_dir / ".env").write_text(env_content)

    api_content = """
export const API_URL = (typeof window !== 'undefined' && (window.location.port === '8000' || window.location.hostname === '127.0.0.1'))
    ? `${window.location.origin}/api/v1`
    : 'http://127.0.0.1:8000/api/v1';

export async function getLiveStore(slug: string) {
    const res = await fetch(`${API_URL}/s/live/${slug}`);
    return await res.json();
}

export async function registerCustomer(slug: string, name: string, email: string, pass: string) {
    const storeRes = await getLiveStore(slug);
    const storeId = storeRes.data?.store?.id;
    if (!storeId) throw new Error("Store Invalid");
    const res = await fetch(`${API_URL}/store/customers/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass, store_id: storeId })
    });
    return await res.json();
}

export async function loginCustomer(slug: string, email: string, pass: string) {
    const storeRes = await getLiveStore(slug);
    const storeId = storeRes.data?.store?.id;
    if (!storeId) throw new Error("Store Invalid");
    const res = await fetch(`${API_URL}/store/customers/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, store_id: storeId })
    });
    return await res.json();
}
"""
    (lib_dir / "api.ts").write_text(api_content.strip(), encoding='utf-8')
    
    # 2. Smart Logic Injection (Logic Fallbacks & Patching)
    def patch_auth_page(file_path: Path, mode: str):
        if not file_path.exists():
            return False
            
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        
        # Avoid double patching
        if "handleSubmit" in content or "loginCustomer" in content or "registerCustomer" in content:
            print(f"✅ {mode.capitalize()} page already functional or patched.")
            return True

        print(f"🔧 AI Patching {mode} UI for {theme_slug}...")
        
        # Step A: Injections (State & Handler)
        is_signup = mode == "signup"
        global API_URL
        
        # Ensure 'use client' is at the very top for Next.js 13+
        content = re.sub(r'["\']use client["\'];?\s*', '', content)
        content = '"use client";\n' + content.lstrip()

        # SANITIZATION: Remove problematic duplicates before patching
        # A. Remove existing state patterns
        state_patterns = [
            r'const\s+\[email,\s*setEmail\]\s*=\s*useState\(.*?\);?',
            r'const\s+\[password,\s*setPassword\]\s*=\s*useState\(.*?\);?',
            r'const\s+\[name,\s*setName\]\s*=\s*useState\(.*?\);?',
            r'const\s+\[loading,\s*setLoading\]\s*=\s*useState\(.*?\);?',
            r'const\s+\[error,\s*setError\]\s*=\s*useState\(.*?\);?',
            r'const\s+handleLogin\s*=\s*\(.*?\)\s*=>\s*\{[\s\S]*?\n\s+\}', # Better match for basic handlers
            r'const\s+handleSignup\s*=\s*\(.*?\)\s*=>\s*\{[\s\S]*?\n\s+\}'
        ]
        for pattern in state_patterns:
            content = re.sub(pattern, '', content)
        
        # Also remove existing handleSubmit if it conflicts
        if "const handleSubmit =" in content and "setAction" not in content:
             content = re.sub(r'const\s+handleSubmit\s*=\s*async\s*\(.*?\)\s*=>\s*\{[\s\S]*?\n\s+\}', '', content)

        # B. Intelligent Import Cleanup
        content = re.sub(r'import\s+.*?loginCustomer.*?from\s+.*?lib/api.*?;?\n?', '', content, flags=re.MULTILINE)
        content = re.sub(r'import\s+.*?registerCustomer.*?from\s+.*?lib/api.*?;?\n?', '', content, flags=re.MULTILINE)
        
        # Remove specific hooks
        content = re.sub(r'\buseState\b\s*,?\s*', '', content)
        content = re.sub(r'\beffect\b\s*,?\s*', '', content, flags=re.IGNORECASE) # In case they have Effect
        content = re.sub(r',\s*\buseEffect\b', '', content)
        content = re.sub(r'\buseEffect\b', '', content)
        
        # Cleanup import syntax { , } -> { }
        content = re.sub(r'\{\s*,', '{', content)
        content = re.sub(r',\s*\}', '}', content)
        content = re.sub(r'\{\s*\}', '', content)
        # Final cleanup for import React from 'react' if nothing left in braces
        content = re.sub(r'import\s+React\s*,\s*from', 'import React from', content)
        
        content = re.sub(r'import\s+API_URL\s+from\s+.*?lib/api.*?;?\n?', '', content)

        logic_code = """
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
        const slug = sessionStorage.getItem('kx_sticky_store') || '';
        const res = await ACTION_PLACEHOLDER;
        if (res.success) {
            const storeRes = await fetch(`${API_URL}/s/live/${slug}`).then(r => r.json());
            const storeId = storeRes.data?.store?.id;
            localStorage.setItem(`customer_token_${storeId}`, res.token);
            localStorage.setItem(`customer_data_${storeId}`, JSON.stringify(res.customer));
            alert("Success!");
            // Smooth redirect using relative path to keep store context
            const params = new URLSearchParams(window.location.search);
            const redirectParams = params.toString() ? `?${params.toString()}` : '';
            window.location.href = `../${redirectParams}`;
        } else {
            setError(res.detail || "Authentication failed");
            alert(res.detail || "Authentication failed");
        }
    } catch (err: any) {
        setError(err.message);
        alert(err.message);
    } finally {
        setLoading(false);
    }
  };
"""
        action = 'registerCustomer(slug, name, email, password)' if is_signup else 'loginCustomer(slug, email, password)'
        logic_code = logic_code.replace("ACTION_PLACEHOLDER", action)

        # Inject Imports
        if 'useState' not in content and 'from "react"' not in content and "from 'react'" not in content:
            content = content.replace('"use client";', '"use client";\nimport { useState } from "react";')
        
        # Define the import line
        api_import_code = "import { " + ('registerCustomer' if is_signup else 'loginCustomer') + ", API_URL } from '../../lib/api';\n"
        if 'from "../../lib/api"' not in content:
            content = content.replace('"use client";', f'"use client";\n{api_import_code}')
        
        # Inject Logic into Component
        # Find the start of the function body
        component_match = re.search(r'export default function\s+\w+\s*\(.*?\)\s*\{', content)
        if component_match:
            insert_pos = component_match.end()
            content = content[:insert_pos] + logic_code + content[insert_pos:]
        
        # Step B: Wire UI (Form & Inputs)
        
        # 1. Password Input - IF MISSING AND LOGIN, INJECT IT BEFORE PASSING TO PATCHER
        if 'type="password"' not in content.lower() and not is_signup:
            print(f"🔧 Missing password input in {file_path.name}. Injecting...")
            # Match the entire input tag - Using negative lookahead to prevent matching previous inputs
            # and handling complex handlers by looking for the closing />
            email_tag_regex = r'<input\b(?:(?!<input)[\s\S])*?type=["\']email["\'][\s\S]*?/>'
            email_match = re.search(f'({email_tag_regex})', content, flags=re.IGNORECASE | re.DOTALL)
            if email_match:
                print(f"📍 Found email input, appending password field...")
                password_html = '\n<div className="input-field"><input type="password" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>'
                content = content.replace(email_match.group(1), email_match.group(1) + password_html)

        # 2. Form - Check if it has onSubmit already and replace it
        if "onSubmit" in content:
            content = re.sub(r'onSubmit=\{[^\}]+\}', 'onSubmit={handleSubmit}', content)
        else:
            content = re.sub(r'<form\b([^>]*?)>', r'<form\1 onSubmit={handleSubmit}>', content)
        
        # Smart attribute replacement
        def patch_input_tag(match, attr_str):
            tag = match.group(0)
            if 'onChange' in tag or 'value=' in tag:
                return tag
            # If attr_str contains 'required' and tag already has it, remove from attr_str
            if 'required' in tag.lower() and 'required' in attr_str:
                attr_str = attr_str.replace('required', '').strip()
            # Strip trailing / or > and add attributes
            base = re.sub(r'\s*/?>$', '', tag)
            return f'{base} {attr_str} />'

        # 3. Email Input
        email_tag_regex = r'<input\b(?:(?!<input)[\s\S])*?type=["\']email["\'][\s\S]*?/>'
        content = re.sub(email_tag_regex, 
                        lambda m: patch_input_tag(m, f'value={{email}} onChange={{(e) => setEmail(e.target.value)}} required'), content, flags=re.IGNORECASE | re.DOTALL)
        
        # 4. Password Input (already injected if was missing)
        password_tag_regex = r'<input\b(?:(?!<input)[\s\S])*?type=["\']password["\'][\s\S]*?/>'
        content = re.sub(password_tag_regex, 
                        lambda m: patch_input_tag(m, f'value={{password}} onChange={{(e) => setPassword(e.target.value)}} required'), content, flags=re.IGNORECASE | re.DOTALL)
        
        # 5. Name Input (only if signup)
        if is_signup:
            name_tag_regex = r'<input\b(?:(?!<input)[\s\S])*?placeholder=["\'][^"\']*(name|Name|User)[^"\']*(?:(?!<input)[\s\S])*?/>'
            content = re.sub(name_tag_regex, 
                            lambda m: patch_input_tag(m, f'value={{name}} onChange={{(e) => setName(e.target.value)}} required'), content, flags=re.IGNORECASE | re.DOTALL)

        file_path.write_text(content, encoding='utf-8')
        return True

    # 3. Apply Patching or Fallback
    app_dir = extract_dir / "app"
    if app_dir.exists():
        # Login
        login_page_path = app_dir / "login" / "page.tsx"
        if not patch_auth_page(login_page_path, "login"):
            login_dir = app_dir / "login"
            login_dir.mkdir(exist_ok=True)
            login_page_path.write_text(LOGIN_TEMPLATE.strip(), encoding='utf-8')
            print(f"✅ Injected Logic Fallback for Login into {theme_slug}")

        # Signup
        signup_page_path = app_dir / "signup" / "page.tsx"
        if not patch_auth_page(signup_page_path, "signup"):
            signup_dir = app_dir / "signup"
            signup_dir.mkdir(exist_ok=True)
            signup_page_path.write_text(SIGNUP_TEMPLATE.strip(), encoding='utf-8')
            print(f"✅ Injected Logic Fallback for Signup into {theme_slug}")

    # 3. Universal Identity Provider (Sticky Store)
    identity_code = '''
"use client";
import { useEffect } from 'react';
import { getLiveStore } from '../lib/api';

export default function KXIdentity() {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const s = new URLSearchParams(window.location.search).get('store');
            if (s) {
                sessionStorage.setItem('kx_sticky_store', s);
                getLiveStore(s).then(data => {
                    if (data.success) {
                        sessionStorage.setItem('kx_store_info', JSON.stringify(data.data?.store));
                        sessionStorage.setItem('kx_store_products', JSON.stringify(data.data?.products));
                        console.log("🏪 Universal Data Sync Complete.");
                        // Force a custom event so the Header knows data is ready
                        window.dispatchEvent(new Event('kx_data_ready'));
                    }
                });
            }
        }
    }, []);
    return null;
}
'''
    (app_dir / "kx-identity.tsx").write_text(identity_code.strip(), encoding='utf-8')

    # 4. Deep Scouter: Recursive Patching of ALL files
    def deep_patch_theme(root_path: Path):
        for file_path in root_path.rglob("*.tsx"):
            if file_path.name == "kx-identity.tsx": continue
            
            content = file_path.read_text(encoding='utf-8', errors='ignore')
            original_content = content
            needs_update = False

            # --- A. Patch Products ---
            # Search for pattern: products = [ { ... } ]
            if re.search(r'(const|let|var)\s+products\s*=\s*\[', content):
                print(f"🛍️  AI Detected product list in {file_path.name}. Swapping...")
                needs_update = True
                
                # Ensure imports
                if 'useState' not in content and 'from "react"' not in content and "from 'react'" not in content:
                    content = content.replace('"use client";', '"use client";\nimport { useState, useEffect } from "react";')
                elif 'useEffect' not in content:
                     # Only replace in the import statement
                     content = re.sub(r'import\s+\{\s*useState\s*\}\s+from', 'import { useState, useEffect } from', content)
                     content = re.sub(r'import\s+useState\s+from', 'import { useState, useEffect } from', content)
                
                injection_logic = '''
    const [products, setProducts] = useState([]);
    useEffect(() => {
        const load = () => {
            const data = sessionStorage.getItem('kx_store_products');
            if (data) {
                const items = JSON.parse(data);
                setProducts(items.map(i => ({...i, title: i.name, name: i.name, icon: "📦"})));
            }
        };
        load();
        window.addEventListener('kx_data_ready', load);
        return () => window.removeEventListener('kx_data_ready', load);
    }, []);
'''
                # Find the function start `{`
                # Supports: export default function Home() { OR const Home = () => {
                header_match = re.search(r'(export\s+default\s+(function\s+\w+|(\w+\s*=\s*\(.*?\)\s*=>)))\s*\{', content)
                if header_match:
                    content = content[:header_match.end()] + injection_logic + content[header_match.end():]
                    # Wipe the static list
                    content = re.sub(r'(const|let|var)\s+products\s*=\s*\[[\s\S]*?\][;,]?', '', content)

            # --- B. Patch Header/Greeting ---
            if any(x in content for x in ['/login', '/signup', 'Login', 'Account', 'Sign In']):
                print(f"👤 AI Identified Navigation in {file_path.name}. Adding greeting...")
                needs_update = True
                
                if 'useState' not in content and 'from "react"' not in content and "from 'react'" not in content:
                    content = content.replace('"use client";', '"use client";\nimport { useState, useEffect } from "react";')
                elif 'useEffect' not in content:
                     # Only replace in the import statement
                     content = re.sub(r'import\s+\{\s*useState\s*\}\s+from', 'import { useState, useEffect } from', content)
                     content = re.sub(r'import\s+useState\s+from', 'import { useState, useEffect } from', content)
                
                greeting_logic = '''
    const [customer, setCustomer] = useState(null);
    useEffect(() => {
        const updateHeader = () => {
            const storeInfo = JSON.parse(sessionStorage.getItem('kx_store_info') || '{}');
            const data = localStorage.getItem(`customer_data_${storeInfo.id}`);
            if (data) setCustomer(JSON.parse(data));
        };
        updateHeader();
        window.addEventListener('kx_data_ready', updateHeader);
        return () => window.removeEventListener('kx_data_ready', updateHeader);
    }, []);
'''
                header_match = re.search(r'(export\s+default\s+(function\s+\w+|(\w+\s*=\s*\(.*?\)\s*=>)))\s*\{', content)
                if not header_match: # Fallback for non-default exports like Navbar
                     header_match = re.search(r'(export\s+(function\s+\w+|(\w+\s*=\s*\(.*?\)\s*=>)))\s*\{', content)

                if header_match:
                    content = content[:header_match.end()] + greeting_logic + content[header_match.end():]
                    
                    # Logic to swap 'Login' text with 'Hi, Name'
                    # We look for common patterns like >Login< or "Login"
                    targets = ['Login', 'Sign In', 'Account', 'Join Net', 'Join Now']
                    for t in targets:
                        content = content.replace(f'>{t}<', f"{{customer ? `Hi, ${{customer.name || customer.firstName || 'User'}}` : '{t}'}}")
                        content = content.replace(f'"{t}"', f"{{customer ? `Hi, ${{customer.name || customer.firstName || 'User'}}` : '{t}'}}")

            # --- C. Patch Dynamic Routes for Static Export ---
            # If the file is in a [something] directory, it needs generateStaticParams for 'output: export'
            if "[" in str(file_path.parent) and "generateStaticParams" not in content and file_path.name == "page.tsx":
                print(f"🔗 AI Patching dynamic route for static export: {file_path.name}...")
                
                # Extract the param name, e.g., [id] -> id
                param_match = re.search(r'\[([^\]]+)\]', str(file_path.parent))
                param_name = param_match.group(1) if param_match else "id"

                # Check if it has "use client" - We can't have both generateStaticParams and use client in one file
                if '"use client"' in content or "'use client'" in content or "useAppContext" in content or "useState" in content:
                    print(f"🔀 Detected Client Component in dynamic route. Performing Wrapper Refactor...")
                    # 1. Rename current to ClientPage.tsx
                    client_file = file_path.parent / "ClientPage.tsx"
                    client_file.write_text(content, encoding='utf-8')
                    
                    # 2. Rewrite page.tsx as a Server Component wrapper
                    wrapper_content = f"""
import ClientPage from './ClientPage';

export async function generateStaticParams() {{
    return [{{ {param_name}: '1' }}, {{ {param_name}: 'p1' }}, {{ {param_name}: 'p2' }}];
}}

export default function Page(props: any) {{
    return <ClientPage {{...props}} />;
}}
"""
                    file_path.write_text(wrapper_content.strip(), encoding='utf-8')
                    needs_update = False # We already handled it by overwriting
                else:
                    # Pure server component, just append
                    content += f"\n\nexport async function generateStaticParams() {{ return [{{ {param_name}: '1' }}]; }}\n"
                    needs_update = True

                if needs_update and original_content != content:
                    if '"use client"' not in content and "'use client'" not in content:
                        content = '"use client";\n' + content
                    file_path.write_text(content, encoding='utf-8')

            # --- D. Patch Layout Metadata Conflict ---
            # If layout.tsx has BOTH "use client" (from our patches or original) AND "export const metadata", it breaks build.
            if file_path.name == "layout.tsx" and "export const metadata" in content and ('"use client"' in content or "'use client'" in content):
                 print(f"🔀 Detected Metadata Conflict in {file_path.name}. Performing Split Refactor...")
                 
                 # 1. Extract Metadata Block
                 # Regex explanation:
                 # export const metadata  -> matches start
                 # (: Metadata)?          -> optional type annotation
                 # =                      -> assignment
                 # \{                     -> start of object
                 # (?:[^{}]|{[^{}]*})*    -> match content (non-nested or one-level nested braces) - heuristic
                 # \}                     -> end of object
                 
                 # Simpler robust approach: Match from 'export const metadata' until the closing brace that matches the indentation or just greedy match if simple
                 # We will use a reasonably greedy match that stops at the closing brace of the object.
                 # Assuming metadata is top-level and ends with '}' at start of line or similar.
                 
                 # Try precise match first
                 meta_match = re.search(r'export\s+const\s+metadata\s*(:\s*[\w<>]+)?\s*=\s*(\{[\s\S]*?\n\s*\})', content)
                 
                 # Fallback: simple match if the above fails (e.g. one-liner)
                 if not meta_match:
                      meta_match = re.search(r'export\s+const\s+metadata\s*(:\s*[\w<>]+)?\s*=\s*(\{.*?\})', content, re.DOTALL)

                 if meta_match:
                     metadata_block = meta_match.group(0)
                     
                     # 2. Prepare Client Layout Content (Remove metadata, keep logic)
                     client_content = content.replace(metadata_block, '// Metadata moved to layout.tsx')
                     
                     # Rename component to avoid potential confusion, although export default is anonymous to importer
                     # Ensure it has 'use client'
                     if '"use client"' not in client_content and "'use client'" not in client_content:
                         client_content = '"use client";\n' + client_content
                     
                     # 3. Write ClientLayout.tsx
                     client_path = file_path.parent / "ClientLayout.tsx"
                     client_path.write_text(client_content, encoding='utf-8')
                     print(f"📦 Created ClientLayout.tsx (Split Check)")

                     # 4. Rewrite layout.tsx as Server Wrapper
                     import_types = ""
                     if ": Metadata" in metadata_block:
                         import_types = 'import type { Metadata } from "next";'
                     
                     # Check imports needed for metadata (e.g. Inter font)
                     # logic: if metadata block references variables, we might need to copy those imports too.
                     # For now, we assume simple metadata strings.
                     
                     new_layout = f"""
{import_types}
import ClientLayout from "./ClientLayout";
import "./globals.css";

{metadata_block}

export default function RootLayout({{ children }}: {{ children: React.ReactNode }}) {{
  return <ClientLayout>{{children}}</ClientLayout>;
}}
"""
                     file_path.write_text(new_layout.strip(), encoding='utf-8')
                     print(f"✅ Rewrote layout.tsx as Server Component wrapper")
                     
                 else:
                     # Fallback: We found the keywords but couldn't parse the block safely. 
                     # Comment it out to save the build.
                     print(f"⚠️ Could not extract metadata block safely. Commenting it out to fix build.")
                     content = re.sub(r'(export\s+const\s+metadata)', r'// \1', content)
                     file_path.write_text(content, encoding='utf-8')

    # Execute Deep Search
    deep_patch_theme(extract_dir)

    # 5. Root Layout (Safety Guard - Robust Header Reconstruction)
    # Check if we split the layout; if so, patch the ClientLayout instead to avoid metadata conflicts
    target_layout = app_dir / "ClientLayout.tsx"
    if not target_layout.exists():
        target_layout = app_dir / "layout.tsx"

    if target_layout.exists():
        content = target_layout.read_text(encoding='utf-8', errors='ignore')
        
        # A. Clean existing artifacts to prevent duplication
        # Remove all existing 'use client' directives
        content = re.sub(r'["\']use client["\'];?\s*', '', content)
        # Remove all existing KXIdentity imports
        content = re.sub(r'import\s+KXIdentity\s+from\s+["\']./kx-identity["\'];?\s*', '', content)
        
        # B. Analyze Requirements
        is_client_layout = target_layout.name == "ClientLayout.tsx"
        has_metadata = "export const metadata" in content
        
        # If it's ClientLayout, we MUST have 'use client'
        # If it's layout.tsx, we ONLY have 'use client' if NO metadata export
        needs_use_client = is_client_layout or (not has_metadata)
        
        # C. Reconstruct Header
        header = ""
        if needs_use_client:
            header += '"use client";\n'
        
        # Always inject the import since we stripped it
        header += 'import KXIdentity from "./kx-identity";\n'
        
        # D. Prepend Header
        content = header + content.lstrip()

        # E. Inject Component Usage (Idempotent check)
        if "<KXIdentity />" not in content:
            if "</body>" in content:
                content = content.replace("</body>", "<KXIdentity /></body>")
            elif "{children}" in content:
                content = content.replace("{children}", "<KXIdentity />{children}")
            
        target_layout.write_text(content, encoding='utf-8')
    else:
        # Create default layout
        layout_code = """import KXIdentity from './kx-identity';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html><body><KXIdentity />{children}</body></html>);
}"""
        (app_dir / "layout.tsx").write_text(layout_code, encoding='utf-8')

    # 6. next.config.js - Essential for serving from /uploads
    base_path_val = f"/uploads/themes/{theme_slug}/out"
    clean_config = f"""
/** @type {{import('next').NextConfig}} */
const nextConfig = {{
  output: 'export',
  distDir: 'out',
  basePath: '{base_path_val}',
  assetPrefix: '{base_path_val}',
  trailingSlash: true,
  staticPageGenerationTimeout: 1000,
  images: {{ unoptimized: true }},
  eslint: {{ ignoreDuringBuilds: true }},
  typescript: {{ ignoreBuildErrors: true }},
}};
module.exports = nextConfig;
"""
    (extract_dir / "next.config.js").write_text(clean_config)

async def process_store_theme_activation(store_slug: str, theme_slug: str):
    """Background task to fully activate a theme for a store (logic injection + build)."""
    def update_store_status(msg: str):
        print(f"🤖 [AI-AUTO] {store_slug} | {msg}")
    
    try:
        extract_dir = UPLOAD_DIR / theme_slug
        zip_path = UPLOAD_DIR / f"{theme_slug}.zip"
        
        if not zip_path.exists():
            update_store_status("Design source (.zip) missing. Activation aborted.")
            return

        # SMART CLEAN: Preserve node_modules and .next to keep builds fast
        update_store_status("Warming up build engine...")
        if extract_dir.exists():
            # Only remove subfolders but KEEP node_modules
            for item in extract_dir.iterdir():
                if item.name not in ["node_modules", ".next", "package-lock.json"]:
                    if item.is_dir(): shutil.rmtree(item)
                    else: item.unlink()
        else:
            extract_dir.mkdir(parents=True, exist_ok=True)
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
            
        # Flatten if nested
        smart_flatten(extract_dir)

        is_nextjs = (extract_dir / "package.json").exists()
        if not is_nextjs:
            update_store_status("Static theme detected. Activation complete.")
            return

        update_store_status("Applying Deep AI Logic Patching...")
        inject_theme_logic(extract_dir, theme_slug)

        # Force Fresh Build
        update_store_status("Compiling Assets (Optimized Pipeline)...")
        log_file = extract_dir / "build_log.txt"
        
        if not (extract_dir / "node_modules").exists():
            update_store_status("First-time setup: Installing base dependencies...")
            run_command(f"npm install --legacy-peer-deps > {log_file} 2>&1", extract_dir)
        
        try:
            run_command(f"npm run build >> {log_file} 2>&1", extract_dir)
            update_store_status("🚀 SUCCESS: Theme is now LIVE with real data.")
        except Exception as build_err:
            update_store_status(f"Build Failed. Check {log_file.name}")
            raise build_err

    except Exception as e:
        print(f"❌ Theme Activation Failed: {e}")
        update_store_status(f"FAILED: {str(e)}")

@router.post("/themes")
async def upload_theme(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    slug: str = Form(...),
    description: Optional[str] = Form(""),
    thumbnail: UploadFile = File(None),
    buildZip: UploadFile = File(...)
):
    """Upload a new theme with thumbnail and ZIP file."""
    try:
        # 0. Handle Duplicate Slug (Clean cleanup for re-upload)
        existing = supabase_admin.table("themes").select("id").eq("slug", slug).execute()
        if existing.data:
            print(f"♻️ Re-uploading theme: {slug}. Cleaning old entry...")
            supabase_admin.table("themes").delete().eq("slug", slug).execute()

        theme_id = str(uuid.uuid4())
        thumbnail_url = ""
        
        # Save thumbnail if provided
        if thumbnail is not None and hasattr(thumbnail, 'filename') and thumbnail.filename:
            ext = thumbnail.filename.split(".")[-1]
            thumb_filename = f"{slug}_thumb.{ext}"
            thumb_path = UPLOAD_DIR / thumb_filename
            with open(thumb_path, "wb") as f:
                content = await thumbnail.read()
                f.write(content)
            thumbnail_url = f"/uploads/themes/{thumb_filename}"
        
        # Save ZIP file safely - Streaming for large files
        zip_filename = f"{slug}.zip"
        zip_path = UPLOAD_DIR / zip_filename
        
        with open(zip_path, "wb") as f:
            while True:
                chunk = await buildZip.read(1024 * 1024) # 1MB chunks
                if not chunk:
                    break
                f.write(chunk)
        
        zip_url = f"/uploads/themes/{slug}.zip"
        extract_dir = UPLOAD_DIR / slug

        # Insert into database with 'building' status
        theme_data = {
            "id": theme_id,
            "name": name,
            "slug": slug,
            "description": description or "Initializing automation...",
            "thumbnail_url": thumbnail_url,
            "zip_url": zip_url,
            "status": "building"
        }
        
        supabase_admin.table("themes").insert(theme_data).execute()
        
        # Start background build process
        background_tasks.add_task(process_theme_build, slug, zip_path, extract_dir)
        
        return {
            "success": True,
            "message": "AI Automation Started! Your theme will be live in 2-4 minutes.",
            "theme": map_theme(theme_data)
        }
        
    except Exception as e:
        print(f"❌ Upload theme error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/themes/{slug}")
async def update_theme(
    slug: str,
    background_tasks: BackgroundTasks,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    thumbnail: Optional[UploadFile] = File(None),
    buildZip: Optional[UploadFile] = File(None)
):
    """Update an existing theme."""
    try:
        update_data = {}
        
        if name:
            update_data["name"] = name
        if description is not None:
            update_data["description"] = description
        if status:
            update_data["status"] = status
        
        # Update thumbnail if provided and valid
        if thumbnail is not None and hasattr(thumbnail, 'filename') and thumbnail.filename:
            ext = thumbnail.filename.split(".")[-1]
            thumb_filename = f"{slug}_thumb.{ext}"
            thumb_path = UPLOAD_DIR / thumb_filename
            with open(thumb_path, "wb") as f:
                content = await thumbnail.read()
                f.write(content)
            update_data["thumbnail_url"] = f"/uploads/themes/{thumb_filename}"
        
        # Update ZIP if provided and valid
        if buildZip is not None and hasattr(buildZip, 'filename') and buildZip.filename:
            zip_filename = f"{slug}.zip"
            zip_path = UPLOAD_DIR / zip_filename
            
            with open(zip_path, "wb") as f:
                while True:
                    chunk = await buildZip.read(1024 * 1024) # 1MB chunks
                    if not chunk:
                        break
                    f.write(chunk)
                
            # Extract ZIP file
            extract_dir = UPLOAD_DIR / slug
            if extract_dir.exists():
                shutil.rmtree(extract_dir)
            extract_dir.mkdir(parents=True, exist_ok=True)
            
            try:
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    zip_ref.extractall(extract_dir)
                
                # Trigger build in background for Next.js themes
                background_tasks.add_task(process_theme_build, slug, zip_path, extract_dir)
                update_data["status"] = "building"
                update_data["description"] = "Updating theme assets..."
                update_data["zip_url"] = f"/uploads/themes/{slug}.zip"
            except Exception as zip_err:
                print(f"❌ Zip extraction error: {zip_err}")
                update_data["zip_url"] = f"/uploads/themes/{zip_filename}"
        
        if update_data:
            supabase_admin.table("themes").update(update_data).eq("slug", slug).execute()
        
        return {"success": True, "message": "Theme updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/themes/{slug}")
async def delete_theme(slug: str):
    """Delete a theme and its files."""
    try:
        # 1. Get theme data (don't use .single() to avoid exceptions if not found)
        response = supabase_admin.table("themes").select("*").eq("slug", slug).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Theme with slug '{slug}' not found")
            
        theme = response.data[0]
        theme_id = theme.get("id")

        # 2. Check if theme is in use by any store
        # Themes are usually stored in config -> theme_id
        # We can do a simple search in stores table. 
        # Since theme_id is in JSONB config, we'll check it.
        stores_using = supabase_admin.table("stores").select("id").filter("config->>theme_id", "eq", theme_id).execute()
        
        if stores_using.data:
            count = len(stores_using.data)
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete theme. It is currently being used by {count} store(s). Please unassign it first."
            )

        # 3. Cleanup files
        try:
            # Remove ZIP
            zip_path = UPLOAD_DIR / f"{slug}.zip"
            if zip_path.exists():
                os.remove(zip_path)
            
            # Remove Extraction folder
            extract_dir = UPLOAD_DIR / slug
            if extract_dir.exists():
                # Use a small wait or check for locks if needed, but shutil.rmtree is usually fine if handled
                shutil.rmtree(extract_dir, ignore_errors=True)
            
            # Remove thumbnails
            for f in UPLOAD_DIR.glob(f"{slug}_thumb.*"):
                try:
                    os.remove(f)
                except: pass
        except Exception as file_err:
            print(f"⚠️ Error cleaning up theme files: {file_err}")

        # 4. Remove from database
        supabase_admin.table("themes").delete().eq("slug", slug).execute()
        
        return {"success": True, "message": "Theme deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Delete Theme Error: {e}")
        raise HTTPException(status_code=400, detail=f"Delete failed: {str(e)}")

@router.post("/themes/apply")
async def apply_theme_to_store(req: ApplyThemeRequest, background_tasks: BackgroundTasks):
    """Link a theme to a store and trigger AI activation."""
    try:
        # 1. Update store config
        store_res = supabase_admin.table("stores").select("id, config").eq("slug", req.store_slug).single().execute()
        if not store_res.data:
            raise HTTPException(status_code=404, detail="Store not found")
        
        # Get theme to find its ID
        theme_res = supabase_admin.table("themes").select("id").eq("slug", req.theme_slug).single().execute()
        if not theme_res.data:
            raise HTTPException(status_code=404, detail="Theme not found")

        theme_id = theme_res.data["id"]
        config = store_res.data.get("config") or {}
        config["theme_id"] = theme_id
        
        supabase_admin.table("stores").update({"config": config}).eq("slug", req.store_slug).execute()

        # 2. Trigger AI Activation in background
        background_tasks.add_task(process_store_theme_activation, req.store_slug, req.theme_slug)

        return {
            "success": True,
            "message": f"AI Processing started for {req.theme_slug}. Your store will be ready in a moment!",
            "status": "processing"
        }
    except Exception as e:
        print(f"❌ Apply Theme Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
