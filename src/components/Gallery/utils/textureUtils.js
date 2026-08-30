import * as THREE from 'three';
import { projects } from '../../../data/projects';

export const rgbaToArray = (rgba) => {
  const match = rgba.match(/rgba?\(([^)]+)\)/);
  if (!match) return [1, 1, 1, 1];

  return match[1].split(',').map((value, index) => {
    const item = parseFloat(value.trim());
    return index < 3 ? item / 255 : item || 1;
  });
};

export const createTextTexture = (title, year) => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = '700 44px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 1)';
  ctx.textBaseline = 'middle';
  ctx.imageSmoothingEnabled = false;
  ctx.textAlign = 'left';
  ctx.fillText(title.toUpperCase(), 30, 385);
  ctx.textAlign = 'right';
  ctx.fillText(String(year).toUpperCase(), 482, 385);

  const texture = new THREE.CanvasTexture(canvas);
  Object.assign(texture, {
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    flipY: false,
    generateMipmaps: false,
    format: THREE.RGBAFormat,
  });

  return texture;
};

export const createTextureAtlas = (textures, isText = false) => {
  const atlasSize = Math.ceil(Math.sqrt(textures.length));
  const textureSize = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = atlasSize * textureSize;
  const ctx = canvas.getContext('2d');

  if (isText) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  textures.forEach((texture, index) => {
    const x = (index % atlasSize) * textureSize;
    const y = Math.floor(index / atlasSize) * textureSize;

    if (texture?.image) {
      if (isText) {
        ctx.drawImage(texture.image, x, y, textureSize, textureSize);
      } else {
        ctx.save();
        ctx.translate(x, y + textureSize);
        ctx.scale(1, -1);
        ctx.drawImage(texture.image, 0, 0, textureSize, textureSize);
        ctx.restore();
      }
    }
  });

  const atlasTexture = new THREE.CanvasTexture(canvas);
  Object.assign(atlasTexture, {
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    flipY: false,
  });

  return atlasTexture;
};

export const loadTextures = async () => {
  const imageTextures = [];
  const textTextures = [];

  for (const project of projects) {
    const texture = await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 512, 512);

        const nextTexture = new THREE.CanvasTexture(canvas);
        Object.assign(nextTexture, {
          wrapS: THREE.ClampToEdgeWrapping,
          wrapT: THREE.ClampToEdgeWrapping,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          flipY: false,
        });
        resolve(nextTexture);
      };

      img.onerror = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PROJECT', canvas.width / 2, canvas.height / 2);

        const fallbackTexture = new THREE.CanvasTexture(canvas);
        Object.assign(fallbackTexture, {
          wrapS: THREE.ClampToEdgeWrapping,
          wrapT: THREE.ClampToEdgeWrapping,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          flipY: false,
        });
        resolve(fallbackTexture);
      };

      img.src = project.image;
    });

    imageTextures.push(texture);
    textTextures.push(createTextTexture(project.title, project.year));
  }

  return { imageTextures, textTextures };
};
