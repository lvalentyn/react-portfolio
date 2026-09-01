import * as THREE from 'three';
import { projects } from '../../data/projects';
import { getGalleryConfig } from './constants';
import { rgbaToArray, createTextureAtlas, loadTextures } from './textureLoader';

export const initGalleryScene = async ({ container, vertexShader, fragmentShader, projectList = projects }) => {
  const config = getGalleryConfig();
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(container.offsetWidth, container.offsetHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  const bgColor = rgbaToArray(config.backgroundColor);
  renderer.setClearColor(new THREE.Color(bgColor[0], bgColor[1], bgColor[2]), bgColor[3]);
  container.appendChild(renderer.domElement);

  const { imageTextures, textTextures } = await loadTextures(projectList);
  const imageAtlas = createTextureAtlas(imageTextures, false);
  const textAtlas = createTextureAtlas(textTextures, true);

  const uniforms = {
    uOffset: { value: new THREE.Vector2(0, 0) },
    uResolution: { value: new THREE.Vector2(container.offsetWidth, container.offsetHeight) },
    uBorderColor: { value: new THREE.Vector4(...rgbaToArray(config.borderColor)) },
    uHoverColor: { value: new THREE.Vector4(...rgbaToArray(config.hoverColor)) },
    uBackgroundColor: { value: new THREE.Vector4(...rgbaToArray(config.backgroundColor)) },
    uMousePos: { value: new THREE.Vector2(-1, -1) },
    uZoom: { value: 1.0 },
    uCellSize: { value: config.cellSize },
    uTextureCount: { value: Math.max(projectList.length, 1) },
    uImageAtlas: { value: imageAtlas },
    uTextAtlas: { value: textAtlas },
  };

  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
  });

  const plane = new THREE.Mesh(geometry, material);
  scene.add(plane);

  return { scene, camera, renderer, plane, uniforms };
};
