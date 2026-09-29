from pathlib import Path
from PIL import Image

root = Path('public/container-configurator/textures/furniture')
for source in root.rglob('*.jpg'):
    destination = source.with_suffix('.webp')
    with Image.open(source) as image:
        image.save(destination, 'WEBP', quality=88, method=6)
    source.unlink()
    print(f'{destination.name}: {destination.stat().st_size // 1024} KB')
