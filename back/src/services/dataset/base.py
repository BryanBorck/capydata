from __future__ import annotations

from enum import Enum, auto
from pathlib import Path
from typing import Any, Sequence

import pandas as pd


class DatasetTask(Enum):
    RAG = auto()
    FINETUNE = auto()


class DataExportFormat(Enum):
    PARQUET = "parquet"
    CSV = "csv"
    HF = "hf"


class DataPack:
    """In-memory representation of a *pack* of data ready to be exported.

    The canonical representation is a list of *records* (dict-like objects) that
    can be marshalled into various export formats.
    """

    def __init__(self, records: Sequence[dict[str, Any]], task: DatasetTask):
        if not records:
            raise ValueError("records cannot be empty")
        self._records = list(records)
        self.task = task

    # ------------------------------------------------------------------
    # Conversions -------------------------------------------------------
    # ------------------------------------------------------------------

    def to_dataframe(self) -> pd.DataFrame:  # noqa: D401
        return pd.DataFrame(self._records)

    def export(self, *, fmt: DataExportFormat, path: str | Path) -> Path:  # noqa: D401
        """Materialise the pack on disk in the requested *fmt*."""
        df = self.to_dataframe()
        path = Path(path)
        match fmt:
            case DataExportFormat.PARQUET:
                df.to_parquet(path, index=False)
            case DataExportFormat.CSV:
                df.to_csv(path, index=False)
            case DataExportFormat.HF:
                try:
                    import datasets as hf_datasets  # type: ignore
                except ImportError as exc:  # pragma: no cover
                    raise RuntimeError("`datasets` package not installed") from exc
                dset = hf_datasets.Dataset.from_pandas(df)
                dset.save_to_disk(str(path))
            case _:
                raise ValueError(f"Unsupported export format: {fmt}")
        return path 