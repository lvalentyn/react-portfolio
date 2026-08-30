import { useEffect, useRef, useState } from 'react';
import { config, vertexShader, fragmentShader } from '../../domain/gallery';
import { initGalleryScene, getProjectByCell, getTargetOffsetForCell, bindGalleryInteractions, getCellFromPointer } from '../../domain/gallery';

export const useGallery = () => {
  const galleryRef = useRef(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const selectedProjectRef = useRef(null);

  const closeModal = () => setSelectedProject(null);

  useEffect(() => {
    selectedProjectRef.current = selectedProject;
    if (!galleryRef.current) return;

    galleryRef.current.style.pointerEvents = selectedProject ? 'none' : '';
    document.body.style.overflow = selectedProject ? 'hidden' : '';
  }, [selectedProject]);

  useEffect(() => {
    const container = galleryRef.current;
    if (!container) return undefined;

    let animationId;
    const offset = { x: 0, y: 0 };
    const targetOffset = { x: 0, y: 0 };
    const mousePosition = { x: -1, y: -1 };
    const viewportState = {
      zoomLevel: 1.0,
      targetZoom: 1.0,
    };

    let scene;
    let camera;
    let renderer;
    let plane;

    const onProjectSelected = ({ tileX, tileY }) => {
      const project = getProjectByCell(tileX, tileY);
      if (!project) return;

      const nextTarget = getTargetOffsetForCell(tileX, tileY);
      targetOffset.x = nextTarget.x;
      targetOffset.y = nextTarget.y;
      setSelectedProject(project);
    };

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      offset.x += (targetOffset.x - offset.x) * config.lerpFactor;
      offset.y += (targetOffset.y - offset.y) * config.lerpFactor;
      viewportState.zoomLevel += (viewportState.targetZoom - viewportState.zoomLevel) * config.lerpFactor;

      if (plane?.material.uniforms) {
        plane.material.uniforms.uOffset.value.set(offset.x, offset.y);
        plane.material.uniforms.uZoom.value = viewportState.zoomLevel;
      }

      renderer.render(scene, camera);
    };

    const resizeHandler = () => {
      if (!container || !camera || !renderer || !plane) return;

      camera.updateProjectionMatrix();
      renderer.setSize(container.offsetWidth, container.offsetHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      plane.material.uniforms.uResolution.value.set(container.offsetWidth, container.offsetHeight);
    };

    const init = async () => {
      const setup = await initGalleryScene({
        container,
        vertexShader,
        fragmentShader,
      });

      ({ scene, camera, renderer, plane } = setup);

      const interactions = bindGalleryInteractions({
        renderer,
        plane,
        selectedProjectRef,
        offset,
        targetOffset,
        mousePosition,
        viewportState,
        getCellFromPointer,
        onProjectSelected,
      });

      interactions.attach();
      window.addEventListener('resize', resizeHandler);
      animate();
    };

    init();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeHandler);
      if (renderer && plane) {
        plane.geometry.dispose();
        plane.material.dispose();
      }
      renderer?.dispose();
      if (container.contains(renderer?.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return {
    galleryRef,
    selectedProject,
    closeModal,
  };
};
