from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

class Database(ABC):
    """Abstract base class for any persistent storage layer used by Datagotchi.

    Concrete implementations should take care of persisting and retrieving binary data
    but MUST remain agnostic regarding the data semantics. The service layer above it
    will transform domain objects (datasets, images, etc.) to raw bytes before calling
    these primitives.
    """

    @abstractmethod
    def write(self, data: bytes, *, path: str) -> str:  # noqa: D401
        """Persist *data* at *path* and return a canonical URI that can later be used
        to retrieve the object.
        """

    @abstractmethod
    def read(self, uri: str) -> bytes:  # noqa: D401
        """Retrieve the bytes previously stored under *uri*."""

    @abstractmethod
    def exists(self, uri: str) -> bool:  # noqa: D401
        """Return True if *uri* exists in the backend."""

    # Convenience helpers -------------------------------------------------

    def write_text(self, text: str, *, path: str, encoding: str = "utf-8") -> str:
        """Utility wrapper that encodes *text* and delegates to :pymeth:`write`."""
        return self.write(text.encode(encoding), path=path)

    def read_text(self, uri: str, encoding: str = "utf-8") -> str:
        """Utility wrapper to read bytes as str."""
        return self.read(uri).decode(encoding)

    # --------------------------------------------------------------------


class LocalFileSystemStorage(Database):
    """Simple implementation backed by the local filesystem (mainly for dev/tests)."""

    def __init__(self, base_path: str | Path):
        self._base_path = Path(base_path).expanduser().resolve()
        self._base_path.mkdir(parents=True, exist_ok=True)

    # Internal helpers ----------------------------------------------------

    def _resolve_path(self, path: str | Path) -> Path:
        return self._base_path / Path(path)

    # StorageBackend interface -------------------------------------------

    def write(self, data: bytes, *, path: str) -> str:
        p = self._resolve_path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(data)
        return str(p)

    def read(self, uri: str) -> bytes:
        p = Path(uri)
        return p.read_bytes()

    def exists(self, uri: str) -> bool:
        return Path(uri).exists() 