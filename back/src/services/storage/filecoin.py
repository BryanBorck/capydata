from __future__ import annotations

from typing import Any

# NOTE: The official Filecoin client SDKs for Python are still WIP. In production we
# would interact with the network via the Lotus HTTP APIs or a gateway like Web3.Storage.
# Here we merely sketch the interface so that the rest of the app can remain
# implementation-agnostic.

from .base import Database


class FilecoinStorage(Database):
    """Stub implementation that should be replaced by a real Filecoin integration."""

    def __init__(self, gateway_url: str | None = None, api_token: str | None = None):
        self.gateway_url = gateway_url or "https://api.web3.storage"  # default public gateway
        self.api_token = api_token  # Optional token for authenticated writes

    # ------------------------------------------------------------------
    # StorageBackend interface
    # ------------------------------------------------------------------

    def write(self, data: bytes, *, path: str) -> str:  # noqa: D401
        # For now we simply raise so that the caller is aware this is a stub.
        raise NotImplementedError("FilecoinStorage.write() is not yet implemented")

    def read(self, uri: str) -> bytes:  # noqa: D401
        raise NotImplementedError("FilecoinStorage.read() is not yet implemented")

    def exists(self, uri: str) -> bool:  # noqa: D401
        # Without a concrete implementation we assume nothing exists.
        return False 