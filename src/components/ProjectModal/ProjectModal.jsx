import './ProjectModal.scss';

const ProjectModal = ({ project, onClose }) => {
  if (!project) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-content"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close popup"
        >
          ×
        </button>

        <img className="modal-image" src={project.image} alt={project.title} />
        <h2 id="project-modal-title" className="modal-title">
          {project.title}
        </h2>
      </div>
    </div>
  );
};

export default ProjectModal;
