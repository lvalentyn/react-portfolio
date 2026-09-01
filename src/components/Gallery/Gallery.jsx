import { useMemo, useState } from 'react';
import { projects } from '../../data/projects';
import { useGallery } from './useGallery';
import ProjectModal from '../ProjectModal/ProjectModal';
import './Gallery.scss';

export const Gallery = () => {
  const { galleryRef, selectedProject, closeModal } = useGallery();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTechs, setSelectedTechs] = useState([]);

  const availableTechs = useMemo(
    () => [...new Set(projects.flatMap((project) => project.tech || []))],
    []
  );

  const toggleTech = (tech) => {
    setSelectedTechs((prev) =>
      prev.includes(tech) ? prev.filter((item) => item !== tech) : [...prev, tech]
    );
  };

  return (
    <>
      <section id="gallery" ref={galleryRef}>
        <div className="vignette-overlay" />
      </section>

      <button
        type="button"
        className="gallery-filter-button"
        aria-label="Open project filter"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsFilterOpen(true);
        }}
      >
        filter
      </button>

      {isFilterOpen && (
        <div className="gallery-filter-backdrop" onClick={() => setIsFilterOpen(false)} role="presentation">
          <div
            className="gallery-filter-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Project filter"
          >
            <div className="gallery-filter-header">
              <h3>Filter</h3>
              <button type="button" className="gallery-filter-close" onClick={() => setIsFilterOpen(false)}>
                ×
              </button>
            </div>

            <div className="gallery-filter-list">
              {availableTechs.map((tech) => (
                <label key={tech} className="gallery-filter-item">
                  <input
                    type="checkbox"
                    checked={selectedTechs.includes(tech)}
                    onChange={() => toggleTech(tech)}
                  />
                  <span>{tech}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <ProjectModal project={selectedProject} onClose={closeModal} />
    </>
  );
};

export default Gallery;
