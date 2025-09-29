"""
Job runner utilities using ThreadPoolExecutor.

Responsibilities:
- Maintain an in-memory registry of jobs and their manifests.
- Persist manifests to disk under artifacts/manifests/<job_id>.json.
- Provide helpers to update status, append progress, attach artifacts.
- Expose create_job(prompt, job_fn) and get_job(job_id).

Manifest schema (MVP):
{
  id: str,
  status: "queued"|"running"|"completed"|"failed",
  created_at: iso8601,
  updated_at: iso8601,
  prompt: str,
  progress: [{t: iso8601, msg: str}],
  artifacts: dict,
  error: {message: str} | null
}
"""

from __future__ import annotations

import json
import os
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict, Optional

from dotenv import load_dotenv


load_dotenv()

# Paths
BASE_DIR = Path(__file__).parent
ARTIFACTS_DIR = Path(os.getenv("ARTIFACTS_DIR", BASE_DIR / "artifacts"))
MANIFESTS_DIR = ARTIFACTS_DIR / "manifests"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
MANIFESTS_DIR.mkdir(parents=True, exist_ok=True)


# Simple job registry with locking
_lock = threading.RLock()
_jobs: Dict[str, Dict[str, Any]] = {}


def _now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def _manifest_path(job_id: str) -> Path:
    return MANIFESTS_DIR / f"{job_id}.json"


def _persist_manifest(job_id: str):
    with _lock:
        manifest = _jobs.get(job_id)
        if not manifest:
            return
        path = _manifest_path(job_id)
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
        tmp.replace(path)


def _load_manifest_from_disk(job_id: str) -> Optional[Dict[str, Any]]:
    path = _manifest_path(job_id)
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text())
        return data
    except Exception:
        return None


def _run_wrapper(job_id: str, prompt: str, job_fn: Callable[[str, str], None]):
    try:
        with _lock:
            manifest = _jobs.get(job_id)
            if manifest:
                manifest["status"] = "running"
                manifest["updated_at"] = _now_iso()
        _persist_manifest(job_id)
        job_fn(job_id, prompt)
    except Exception as exc:  # pragma: no cover - defensive
        fail_job(job_id, str(exc))


# Public API
_executor = ThreadPoolExecutor(max_workers=int(os.getenv("JOB_WORKERS", "4")))


def create_job(prompt: str, job_fn: Callable[[str, str], None]) -> str:
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    manifest = {
        "id": job_id,
        "status": "queued",
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
        "prompt": prompt,
        "progress": [],
        "artifacts": {},
        "error": None,
    }
    with _lock:
        _jobs[job_id] = manifest
    _persist_manifest(job_id)
    _executor.submit(_run_wrapper, job_id, prompt, job_fn)
    return job_id


def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    with _lock:
        manifest = _jobs.get(job_id)
    if manifest:
        return manifest
    # Fallback to disk
    disk = _load_manifest_from_disk(job_id)
    if disk:
        with _lock:
            _jobs[job_id] = disk
        return disk
    return None


def append_progress(job_id: str, message: str):
    with _lock:
        manifest = _jobs.get(job_id)
        if not manifest:
            return
        manifest.setdefault("progress", []).append({"t": _now_iso(), "msg": message})
        manifest["updated_at"] = _now_iso()
    _persist_manifest(job_id)


def attach_artifact(job_id: str, key: str, value: Any):
    with _lock:
        manifest = _jobs.get(job_id)
        if not manifest:
            return
        manifest.setdefault("artifacts", {})[key] = value
        manifest["updated_at"] = _now_iso()
    _persist_manifest(job_id)


def complete_job(job_id: str):
    with _lock:
        manifest = _jobs.get(job_id)
        if not manifest:
            return
        manifest["status"] = "completed"
        manifest["updated_at"] = _now_iso()
    _persist_manifest(job_id)


def fail_job(job_id: str, message: str):
    with _lock:
        manifest = _jobs.get(job_id)
        if not manifest:
            return
        manifest["status"] = "failed"
        manifest["error"] = {"message": message}
        manifest["updated_at"] = _now_iso()
    _persist_manifest(job_id)


