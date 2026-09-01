import { useEffect, useMemo, useState } from 'react';
import { projects } from '../../data/projects';
import { useGallery } from './useGallery';
import ProjectModal from '../ProjectModal/ProjectModal';
import './Gallery.scss';

export const Gallery = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTechs, setSelectedTechs] = useState(new Set());
  const [lastNonEmptyProjects, setLastNonEmptyProjects] = useState(projects);

  const filteredProjects = useMemo(() => {
    if (selectedTechs.size === 0) return projects;

    return [...projects]
      .filter((project) => (project.tech || []).some((tech) => selectedTechs.has(tech)))
      .sort((projectA, projectB) => {
        const scoreA = (projectA.tech || []).reduce(
          (total, tech) => total + (selectedTechs.has(tech) ? 1 : 0),
          0
        );
        const scoreB = (projectB.tech || []).reduce(
          (total, tech) => total + (selectedTechs.has(tech) ? 1 : 0),
          0
        );
        return scoreB - scoreA;
      });
  }, [selectedTechs]);

  const displayProjects = filteredProjects.length > 0 ? filteredProjects : lastNonEmptyProjects;

  useEffect(() => {
    if (filteredProjects.length > 0) {
      setLastNonEmptyProjects(filteredProjects);
    }
  }, [filteredProjects]);


  const galleryKey = selectedTechs.size ? `filtered-${selectedTechs.size}` : 'all-projects';

  const { galleryRef, selectedProject, closeModal } = useGallery({ projectList: displayProjects });

  const availableTechs = useMemo(
    () => [...new Set(projects.flatMap((project) => project.tech || []))],
    []
  );

  const toggleTech = (tech) => {
    setSelectedTechs((prev) => {
      const updated = new Set(prev);
      if (updated.has(tech)) {
        updated.delete(tech);
      } else {
        updated.add(tech);
      }
      return updated;
    });
  };

  const clearFilters = () => {
    setSelectedTechs(new Set());
    setIsFilterOpen(false);
  };

  return (
    <>
      <section id="gallery" ref={galleryRef} key={galleryKey} className="gallery-scene">
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
              <h3>Filter ({displayProjects.length})</h3>
              <button type="button" className="gallery-filter-close" onClick={() => setIsFilterOpen(false)}>
                ×
              </button>
            </div>

            <div className="gallery-filter-list">
              {availableTechs.map((tech) => (
                <label key={tech} className="gallery-filter-item">
                  <input
                    type="checkbox"
                    checked={selectedTechs.has(tech)}
                    onChange={() => toggleTech(tech)}
                  />
                  <span>{tech}</span>
                </label>
              ))}
            </div>

            {selectedTechs.size > 0 && (
              <button type="button" className="gallery-filter-clear" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      <ProjectModal project={selectedProject} onClose={closeModal} />
    </>
  );
};

export default Gallery;
