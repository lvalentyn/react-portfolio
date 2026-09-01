import { projects } from '../../data/projects';
import { getGalleryConfig } from './constants';

export const getProjectByCell = (cellX, cellY) => {
  const columns = Math.ceil(Math.sqrt(projects.length));
  const texIndex = Math.floor((cellX + cellY * columns) % projects.length);
  const actualIndex = texIndex < 0 ? projects.length + texIndex : texIndex;

  return projects[actualIndex];
};

export const getTargetOffsetForCell = (cellX, cellY) => {
  const config = getGalleryConfig();

  return {
    x: (cellX + 0.5) * config.cellSize,
    y: (cellY + 0.5) * config.cellSize,
  };
};

export const getCellFromPointer = ({ endX, endY, rect, zoomLevel, offset }) => {
  const config = getGalleryConfig();
  const screenX = ((endX - rect.left) / rect.width) * 2 - 1;
  const screenY = -(((endY - rect.top) / rect.height) * 2 - 1);

  const radius = Math.hypot(screenX, screenY);
  const distortion = 1.0 - 0.08 * radius * radius;
  const aspectX = rect.width / rect.height;
  const worldX = (screenX * distortion * aspectX) * zoomLevel + offset.x;
  const worldY = (screenY * distortion) * zoomLevel + offset.y;

  return {
    cellX: Math.floor(worldX / config.cellSize),
    cellY: Math.floor(worldY / config.cellSize),
    worldX,
    worldY,
  };
};
