"""Download the CC0 Poly Haven furniture used by Container Studio.

Each glTF keeps its published 1K color, normal, and roughness textures.
The API provides hashes so an interrupted download can be resumed safely.
"""

import hashlib
import json
from pathlib import Path
from urllib.request import Request, urlopen


ASSETS = (
    "sofa_02",
    "modern_coffee_table_01",
    "wooden_table_02",
    "dining_chair_02",
    "vintage_day_bed",
    "metal_office_desk",
    "drawer_cabinet",
)
ROOT = Path(__file__).resolve().parents[1] / "public/container-configurator/models/polyhaven"


def download(url: str) -> bytes:
    request = Request(url, headers={"User-Agent": "Mozilla/5.0 (ContainerStudio asset downloader)"})
    with urlopen(request, timeout=90) as response:
        return response.read()


def save(path: Path, url: str, md5: str) -> None:
    if path.exists() and hashlib.md5(path.read_bytes()).hexdigest() == md5:
        return
    data = download(url)
    if hashlib.md5(data).hexdigest() != md5:
        raise ValueError(f"Hash mismatch: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


for asset_id in ASSETS:
    files = json.loads(download(f"https://api.polyhaven.com/files/{asset_id}"))
    source = files["gltf"]["1k"]["gltf"]
    destination = ROOT / asset_id
    save(destination / f"{asset_id}_1k.gltf", source["url"], source["md5"])
    for relative_path, dependency in source["include"].items():
        save(destination / relative_path, dependency["url"], dependency["md5"])
    print(f"Downloaded {asset_id}")
