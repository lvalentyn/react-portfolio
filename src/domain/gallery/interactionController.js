import { getGalleryConfig } from './constants';

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
  let inertiaFrameId = null;
  const previousMouse = { x: 0, y: 0 };
  const velocity = { x: 0, y: 0 };

  const isDesktop = () => {
    if (typeof window === 'undefined') return false;
    return !window.matchMedia('(pointer: coarse)').matches && window.innerWidth > 768;
  };

  const getCurrentConfig = () => getGalleryConfig();

  const updateZoom = (value) => {
    viewportState.targetZoom = value;
  };

  const startDrag = (x, y) => {
    if (selectedProjectRef.current) return;

    const currentConfig = getCurrentConfig();

    if (inertiaFrameId) {
      cancelAnimationFrame(inertiaFrameId);
      inertiaFrameId = null;
    }

    isDragging = true;
    isClick = true;
    clickStartTime = Date.now();
    velocity.x = 0;
    velocity.y = 0;
    document.body.classList.add('dragging');
    previousMouse.x = x;
    previousMouse.y = y;

    setTimeout(() => {
      if (isDragging) updateZoom(currentConfig.zoomLevel);
    }, 150);
  };

  const handleMove = (currentX, currentY) => {
    if (selectedProjectRef.current) return;
    if (!isDragging || currentX === undefined || currentY === undefined) return;

    const currentConfig = getCurrentConfig();
    const deltaX = currentX - previousMouse.x;
    const deltaY = currentY - previousMouse.y;

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      isClick = false;
      if (viewportState.targetZoom === 1.0) updateZoom(currentConfig.zoomLevel);
    }

    if (isDesktop()) {
      velocity.x = -(deltaX * 0.024);
      velocity.y = deltaY * 0.024;
    }

    targetOffset.x -= deltaX * currentConfig.dragSensitivity;
    targetOffset.y += deltaY * currentConfig.dragSensitivity;
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
    // Ignore if clicking on filter button, backdrop, or modal
    const target = event.target;
    if (target?.closest('.gallery-filter-button, .gallery-filter-backdrop, .gallery-filter-modal')) return;
    startDrag(event.clientX, event.clientY);
  };

  const onPointerMove = (event) => {
    if (selectedProjectRef.current) return;
    handleMove(event.clientX, event.clientY);
  };

  const onTouchStart = (event) => {
    if (selectedProjectRef.current) return;
    // Ignore if touching on filter button, backdrop, or modal
    const target = event.target;
    if (target?.closest('.gallery-filter-button, .gallery-filter-backdrop, .gallery-filter-modal')) return;
    event.preventDefault();
    startDrag(event.touches[0].clientX, event.touches[0].clientY);
  };

  const onTouchMove = (event) => {
    if (selectedProjectRef.current) return;
    event.preventDefault();
    handleMove(event.touches[0].clientX, event.touches[0].clientY);
  };

  const applyInertia = () => {
    if (!isDesktop() || isDragging) return;

    const tick = () => {
      if (isDragging) return;

      targetOffset.x += velocity.x;
      targetOffset.y += velocity.y;
      velocity.x *= 0.72;
      velocity.y *= 0.72;

      if (Math.abs(velocity.x) < 0.003 && Math.abs(velocity.y) < 0.003) {
        velocity.x = 0;
        velocity.y = 0;
        inertiaFrameId = null;
        return;
      }

      inertiaFrameId = requestAnimationFrame(tick);
    };

    if (inertiaFrameId) cancelAnimationFrame(inertiaFrameId);
    inertiaFrameId = requestAnimationFrame(tick);
  };

  const onPointerUp = (event) => {
    if (selectedProjectRef.current) return;

    // Ignore clicks on filter button, backdrop, or modal
    const target = event.target || event.changedTouches?.[0]?.target;
    if (target?.closest('.gallery-filter-button, .gallery-filter-backdrop, .gallery-filter-modal')) {
      isDragging = false;
      document.body.classList.remove('dragging');
      updateZoom(1.0);
      return;
    }

    isDragging = false;
    document.body.classList.remove('dragging');
    updateZoom(1.0);

    if (isDesktop() && !isClick) {
      applyInertia();
    }

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
