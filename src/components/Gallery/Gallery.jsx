import { useGallery } from './useGallery';
import ProjectModal from '../ProjectModal/ProjectModal';
import './Gallery.scss';

export const Gallery = () => {
  const { galleryRef, selectedProject, closeModal } = useGallery();

  return (
    <>
      <section id="gallery" ref={galleryRef}>
        <div className="vignette-overlay" />
      </section>

      <ProjectModal project={selectedProject} onClose={closeModal} />
    </>
  );
};

export default Gallery;
