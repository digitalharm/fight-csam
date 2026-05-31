"""Expected hash recording for synthetic fixtures.

Every synthetic fixture has a real, computed hash (via hashkit's port of the
upstream PDQ reference) that downstream tests assert against. The expectations
live in `packages/hashkit/vectors/v0/corpus.json` and are the conformance
contract between every hashkit binding.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


HashKind = Literal["pdq", "pdq-dihedral", "tmk"]


@dataclass(frozen=True, slots=True)
class ExpectedHash:
    """The expected hash for a fixture, recorded in the conformance corpus.

    Attributes:
        fixture_id: the identifier of the SyntheticImage or SyntheticVideo.
        kind: which hash function produced this expectation.
        hash_hex: 64-character lowercase hex (PDQ) or structured form (TMK).
        quality: 0-100, PDQ only.
        ncmec_verified: True if the expectation has been cross-validated
            against NCMEC's reference outputs through the credentialed
            relationship.
    """

    fixture_id: str
    kind: HashKind
    hash_hex: str
    quality: int | None = None
    ncmec_verified: bool = False
