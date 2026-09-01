import { useEffect, useRef, useState } from 'react';
import { projects as allProjects } from '../../data/projects';
import { config, vertexShader, fragmentShader } from '../../domain/gallery';
import { initGalleryScene, getProjectByCell, getTargetOffsetForCell, bindGalleryInteractions, getCellFromPointer } from '../../domain/gallery';

export const useGallery = ({ projectList = allProjects } = {}) => {
  const galleryRef = useRef(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const selectedProjectRef = useRef(null);
  const interactionsRef = useRef(null);

  const closeModal = () => setSelectedProject(null);

  useEffect(() => {
    selectedProjectRef.current = selectedProject;
    if (!galleryRef.current) return;

    if (selectedProject) {
      // When opening modal - reset drag state immediately
      if (interactionsRef.current) {
        interactionsRef.current.resetDragState();
      }
      galleryRef.current.style.pointerEvents = 'none';
      document.body.style.overflow = 'hidden';
    } else {
      // When closing modal - reset drag state
      if (interactionsRef.current) {
        interactionsRef.current.resetDragState();
      }
      galleryRef.current.style.pointerEvents = '';
      document.body.style.overflow = '';
    }
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
    let interactions;

    const closeModal = () => setSelectedProject(null);

    const onProjectSelected = ({ tileX, tileY }) => {
      const project = getProjectByCell(projectList, tileX, tileY);
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

      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
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
        projectList,
      });

      ({ scene, camera, renderer, plane } = setup);

      interactions = bindGalleryInteractions({
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

      interactionsRef.current = interactions;
      interactions.attach();
      window.addEventListener('resize', resizeHandler);
      animate();
    };

    init();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeHandler);
      interactions?.detach();

      // Dispose all textures first
      if (plane?.material?.uniforms) {
        const { uImageAtlas, uTextAtlas } = plane.material.uniforms;
        if (uImageAtlas?.value) {
          uImageAtlas.value.dispose();
        }
        if (uTextAtlas?.value) {
          uTextAtlas.value.dispose();
        }
      }

      // Dispose geometry and material
      if (plane) {
        if (plane.geometry) {
          plane.geometry.dispose();
        }
        if (plane.material) {
          plane.material.dispose();
        }
      }

      // Remove and dispose scene
      if (scene) {
        while (scene.children.length > 0) {
          const child = scene.children[0];
          scene.remove(child);
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      }

      // Dispose renderer and force context loss
      if (renderer) {
        try {
          const gl = renderer.getContext();
          if (gl) {
            const ext = gl.getExtension('WEBGL_lose_context');
            if (ext) {
              ext.loseContext();
            }
          }
        } catch (e) {
          // Context might already be lost
        }
        renderer.dispose();
      }

      // Remove canvas from DOM
      if (container && renderer?.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      // Clear interactions ref
      interactionsRef.current = null;
    };
  }, [projectList]);

  return {
    galleryRef,
    selectedProject,
    closeModal,
  };
};
