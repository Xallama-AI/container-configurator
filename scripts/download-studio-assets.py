"""Reproducible CC0 asset preparation for the isolated Container Studio."""
import io, json, struct, urllib.request, zipfile
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / 'public/container-configurator'
HEADERS = {'User-Agent': 'ContainerStudio/1.0 asset-research'}
def download(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=60).read()
def api(asset, endpoint='files'):
    return json.loads(download('https://api.polyhaven.com/' + endpoint + '/' + asset))
def texture(job):
    asset, folder = job
    target = ROOT / 'textures' / folder
    target.mkdir(parents=True, exist_ok=True)
    files = api(asset)
    images = {}
    for source, name in [('Diffuse', 'color'), ('nor_gl', 'normal'), ('AO', 'ao'), ('Rough', 'roughness')]:
        images[name] = Image.open(io.BytesIO(download(files[source]['1k']['jpg']['url']))).convert('RGB')
    images['color'].save(target / 'color.webp', quality=84, method=6)
    images['normal'].save(target / 'normal.webp', lossless=True, method=6)
    ao = images['ao'].getchannel('R')
    rough = images['roughness'].getchannel('R')
    Image.merge('RGB', (ao, rough, Image.new('L', ao.size, 0))).save(target / 'arm.webp', lossless=True, method=6)
    images['color'].resize((192,192)).save(target / 'preview.webp', quality=80)
    info = api(asset, 'info')
    return {'asset':asset, 'folder':folder, 'source':'https://polyhaven.com/a/'+asset, 'license':'CC0', 'authors':info.get('authors'), 'dimensions':info.get('dimensions')}

def grass_texture(archive=None):
    """Short, clean green lawn rather than a sparse/dry ground scan."""
    url = 'https://acg-download.struffelproductions.com/file/ambientCG-Web/download/Grass005_MPzT24Bl/Grass005_1K-JPG.zip'
    files = zipfile.ZipFile(io.BytesIO(archive if archive is not None else download(url)))
    def load(name):
        return Image.open(io.BytesIO(files.read('Grass005_1K-JPG_' + name + '.jpg'))).convert('RGB')
    target = ROOT / 'textures/grass'
    target.mkdir(parents=True, exist_ok=True)
    color = load('Color')
    color.save(target / 'color.webp', quality=88, method=6)
    load('NormalGL').save(target / 'normal.webp', quality=95, method=6)
    ao = load('AmbientOcclusion').resize((512,512), Image.Resampling.LANCZOS).getchannel('R')
    rough = load('Roughness').resize((512,512), Image.Resampling.LANCZOS).getchannel('R')
    Image.merge('RGB', (ao, rough, Image.new('L', ao.size, 0))).save(target / 'arm.webp', lossless=True, method=6)
    color.resize((192,192)).save(target / 'preview.webp', quality=85)
    return {'asset':'Grass005', 'folder':'grass', 'source':'https://ambientcg.com/view?id=Grass005', 'license':'CC0', 'authors':{'Lennart Demes':'ambientCG'}, 'resolution':'1K color/normal; 512px AO/roughness', 'optimization':'High-quality WebP color/normal, lossless packed AO and roughness'}

if __name__ == '__main__':
    jobs=[('wooden_floor_02','wood/light-oak'),('wood_floor','wood/natural-oak'),('plank_flooring_02','wood/dark-walnut'),('wood_floor_worn','wood/warm-wood')]
    manifest=[grass_texture()]
    with ThreadPoolExecutor(max_workers=5) as pool:
        manifest+=list(pool.map(texture,jobs))
    environment=ROOT/'environment';environment.mkdir(parents=True,exist_ok=True)
    hdr=api('kloofendal_overcast')['hdri']['1k']['hdr']
    (environment/'overcast-1k.hdr').write_bytes(download(hdr['url']))
    model=api('exterior_aircon_unit')['gltf']['1k']['gltf']
    gltf=json.loads(download(model['url']))
    includes=model['include']
    binary=bytearray(download(includes[gltf['buffers'][0]['uri']]['url']))
    while len(binary)%4:binary.append(0)
    # The source includes a second rusted variant. Ship only the clean unit.
    gltf['nodes']=gltf['nodes'][:1];gltf['meshes']=gltf['meshes'][:1]
    gltf['scenes']=[{'nodes':[0]}];gltf['scene']=0
    gltf['materials']=gltf['materials'][:2];gltf['textures']=gltf['textures'][:6];gltf['images']=gltf['images'][:6]
    for image in gltf['images']:
        source=download(includes[image.pop('uri')]['url'])
        img=Image.open(io.BytesIO(source)).convert('RGB');img.thumbnail((512,512))
        stream=io.BytesIO();img.save(stream,format='JPEG',quality=88,optimize=True)
        b=stream.getvalue();offset=len(binary);binary.extend(b)
        image['bufferView']=len(gltf['bufferViews']);image['mimeType']='image/jpeg'
        gltf['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(b)})
        while len(binary)%4:binary.append(0)
    gltf['buffers']=[{'byteLength':len(binary)}]
    encoded=json.dumps(gltf,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
    glb=struct.pack('<III',0x46546c67,2,12+8+len(encoded)+8+len(binary))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(binary),0x004e4942)+binary
    models=ROOT/'models/ac';models.mkdir(parents=True,exist_ok=True)
    (models/'outdoor-condenser.glb').write_bytes(glb)
    manifest += [{'asset':'exterior_aircon_unit','source':'https://polyhaven.com/a/exterior_aircon_unit','license':'CC0','optimization':'Clean variant only, embedded 512px JPEG textures, binary GLB.'},{'asset':'kloofendal_overcast','source':'https://polyhaven.com/a/kloofendal_overcast','license':'CC0','resolution':'1K'}]
    (ROOT/'assets.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    print('Prepared',len(manifest),'CC0 assets;',sum(p.stat().st_size for p in ROOT.rglob('*') if p.is_file()),'bytes')
