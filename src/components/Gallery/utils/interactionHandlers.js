import { config } from '../galleryConfig';

export const bindGalleryInteractions = ({
  renderer,
  plane,
  selectedProjectRef,
  offset,
  targetOffset,
  mousePosition,
  viewportState,
  getCellFromPointer,
  onProjectSelected,
}) => {
  let isDragging = false;
  let isClick = true;
  let clickStartTime = 0;
  const previousMouse = { x: 0, y: 0 };

  const updateZoom = (value) => {
    viewportState.targetZoom = value;
  };

  const startDrag = (x, y) => {
    if (selectedProjectRef.current) return;

    isDragging = true;
    isClick = true;
    clickStartTime = Date.now();
    document.body.classList.add('dragging');
    previousMouse.x = x;
    previousMouse.y = y;
    setTimeout(() => {
      if (isDragging) updateZoom(config.zoomLevel);
    }, 150);
  };

  const handleMove = (currentX, currentY) => {
    if (selectedProjectRef.current) return;
    if (!isDragging || currentX === undefined || currentY === undefined) return;

    const deltaX = currentX - previousMouse.x;
    const deltaY = currentY - previousMouse.y;

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      isClick = false;
      if (viewportState.targetZoom === 1.0) updateZoom(config.zoomLevel);
    }

    targetOffset.x -= deltaX * 0.003;
    targetOffset.y += deltaY * 0.003;
    previousMouse.x = currentX;
    previousMouse.y = currentY;
  };

  const updateMousePosition = (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mousePosition.x = event.clientX - rect.left;
    mousePosition.y = event.clientY - rect.top;
    plane?.material.uniforms.uMousePos.value.set(mousePosition.x, mousePosition.y);
  };

  const onPointerDown = (event) => {
    if (selectedProjectRef.current) return;
    startDrag(event.clientX, event.clientY);
  };

  const onPointerMove = (event) => {
    if (selectedProjectRef.current) return;
    handleMove(event.clientX, event.clientY);
  };

  const onTouchStart = (event) => {
    if (selectedProjectRef.current) return;
    event.preventDefault();
    startDrag(event.touches[0].clientX, event.touches[0].clientY);
  };

  const onTouchMove = (event) => {
    if (selectedProjectRef.current) return;
    event.preventDefault();
    handleMove(event.touches[0].clientX, event.touches[0].clientY);
  };

  const onPointerUp = (event) => {
    if (selectedProjectRef.current) return;

    isDragging = false;
    document.body.classList.remove('dragging');
    updateZoom(1.0);

    if (isClick && Date.now() - clickStartTime < 200) {
      const endX = event.clientX || event.changedTouches?.[0]?.clientX;
      const endY = event.clientY || event.changedTouches?.[0]?.clientY;

      if (endX !== undefined && endY !== undefined) {
        const rect = renderer.domElement.getBoundingClientRect();
        const { cellX, cellY } = getCellFromPointer({
          endX,
          endY,
          rect,
          zoomLevel: viewportState.zoomLevel,
          offset,
        });

        onProjectSelected({ tileX: cellX, tileY: cellY });
      }
    }
  };

  const attach = () => {
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('mouseup', onPointerUp);
    document.addEventListener('mouseleave', onPointerUp);

    const passiveOpts = { passive: false };
    document.addEventListener('touchstart', onTouchStart, passiveOpts);
    document.addEventListener('touchmove', onTouchMove, passiveOpts);
    document.addEventListener('touchend', onPointerUp, passiveOpts);

    document.addEventListener('contextmenu', (event) => event.preventDefault());
    renderer.domElement.addEventListener('mousemove', updateMousePosition);
    renderer.domElement.addEventListener('mouseleave', () => {
      mousePosition.x = mousePosition.y = -1;
      plane?.material.uniforms.uMousePos.value.set(-1, -1);
    });
  };

  const detach = () => {
    document.removeEventListener('mousedown', onPointerDown);
    document.removeEventListener('mousemove', onPointerMove);
    document.removeEventListener('mouseup', onPointerUp);
    document.removeEventListener('mouseleave', onPointerUp);
    document.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onPointerUp);
    document.removeEventListener('contextmenu', (event) => event.preventDefault());
    renderer.domElement.removeEventListener('mousemove', updateMousePosition);
  };

  return { attach, detach };
};
