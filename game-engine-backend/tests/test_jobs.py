import os
import time
from pathlib import Path

from .. import jobs


def short_job(job_id: str, prompt: str):
    jobs.append_progress(job_id, f"start:{prompt}")
    time.sleep(0.05)
    jobs.append_progress(job_id, "halfway")
    jobs.attach_artifact(job_id, "k", {"v": 1})
    jobs.complete_job(job_id)


def test_job_lifecycle(tmp_path, monkeypatch):
    monkeypatch.setenv("ARTIFACTS_DIR", str(tmp_path / "artifacts"))
    # Reload module to pick up new ARTIFACTS_DIR
    from importlib import reload
    reload(jobs)

    job_id = jobs.create_job("p", short_job)
    assert job_id

    # Poll until completed
    for _ in range(60):
        m = jobs.get_job(job_id)
        assert m is not None
        if m["status"] == "completed":
            break
        time.sleep(0.05)
    m = jobs.get_job(job_id)
    assert m["status"] == "completed"
    assert len(m["progress"]) >= 2
    assert "k" in m["artifacts"]

    # Manifest persisted
    path = Path(os.environ["ARTIFACTS_DIR"]) / "manifests" / f"{job_id}.json"
    assert path.exists()
    data = path.read_text()
    assert job_id in data


