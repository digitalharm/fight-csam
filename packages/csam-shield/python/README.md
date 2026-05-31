# csam-shield (Python)

Python sibling of [`@digitalharm/csam-shield`](../node). Same `MatchResponse`
model, same detector adapter interface, native FastAPI / Starlette / Flask
middleware.

**Status:** see [`STATUS`](../STATUS) — canonical state across all tools at
[`docs/roadmap.md`](../../../docs/roadmap.md). **License:** Apache 2.0.

## Install

```bash
pip install csam-shield                   # core only
pip install "csam-shield[fastapi]"        # + FastAPI adapter
pip install "csam-shield[starlette]"      # + Starlette adapter
pip install "csam-shield[flask]"          # + Flask adapter
```

## Quick start

```python
import asyncio
from csam_shield import (
    DetectorConfig, ImageBytes, ShieldConfig, create_shield,
)

shield = create_shield(ShieldConfig(
    detectors=[
        DetectorConfig(
            detector="cloudflare-csam-scanning",
            config={"token": os.environ["CF_TOKEN"]},
        ),
        DetectorConfig(
            detector="photodna",
            config={"api_key": os.environ["PHOTODNA_KEY"]},
        ),
    ],
    strategy="any-match",
))

result = await shield.scan(
    ImageBytes(data=image_bytes, content_type="image/jpeg")
)
if result.decision == "match":
    # block + escalate to CyberTipline via cybertip-cli
    ...
```

See the [package README](..) for the design context and the
[roadmap](../../../docs/roadmap.md) for current status. All wire-protocol
adapters are scaffold stubs until each upstream's credentialing path is
unblocked.
