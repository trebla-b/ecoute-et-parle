import csv
from pathlib import Path
from typing import Dict, Iterable, List, Optional

from filelock import FileLock


class CSVStore:
    """Simple CSV-backed persistence with advisory file locking."""

    def __init__(self, path: Path, fieldnames: List[str], id_field: str = "id"):
        self.path = Path(path)
        self.fieldnames = fieldnames
        self.id_field = id_field
        self.lock = FileLock(str(self.path) + ".lock")
        self._ensure_file()

    def _ensure_file(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            with self.lock:
                with self.path.open("w", newline="", encoding="utf-8") as fp:
                    writer = csv.DictWriter(fp, fieldnames=self.fieldnames)
                    writer.writeheader()

    def read_all(self) -> List[Dict[str, str]]:
        with self.lock:
            return self._read_all_locked()

    def append(self, row: Dict[str, str]) -> None:
        with self.lock:
            with self.path.open("a", newline="", encoding="utf-8") as fp:
                writer = csv.DictWriter(fp, fieldnames=self.fieldnames)
                writer.writerow(row)

    def replace_all(self, rows: Iterable[Dict[str, str]]) -> None:
        with self.lock:
            self._write_all_locked(list(rows))

    def update(self, row_id: str, new_row: Dict[str, str]) -> bool:
        with self.lock:
            rows = self._read_all_locked()
            replaced = False
            for idx, row in enumerate(rows):
                if row.get(self.id_field) == row_id:
                    rows[idx] = new_row
                    replaced = True
                    break
            if replaced:
                self._write_all_locked(rows)
            return replaced

    def delete(self, row_id: str) -> bool:
        with self.lock:
            rows = self._read_all_locked()
            new_rows = [row for row in rows if row.get(self.id_field) != row_id]
            if len(new_rows) == len(rows):
                return False
            self._write_all_locked(new_rows)
            return True

    def get(self, row_id: str) -> Optional[Dict[str, str]]:
        with self.lock:
            for row in self._read_all_locked():
                if row.get(self.id_field) == row_id:
                    return row
        return None

    # Internal helpers -----------------------------------------------------

    def _read_all_locked(self) -> List[Dict[str, str]]:
        if not self.path.exists():
            return []
        with self.path.open("r", newline="", encoding="utf-8") as fp:
            reader = csv.DictReader(fp, fieldnames=self.fieldnames)
            # Consume header
            next(reader, None)
            return [dict(row) for row in reader]

    def _write_all_locked(self, rows: List[Dict[str, str]]) -> None:
        with self.path.open("w", newline="", encoding="utf-8") as fp:
            writer = csv.DictWriter(fp, fieldnames=self.fieldnames)
            writer.writeheader()
            writer.writerows(rows)
