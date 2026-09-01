import './ProjectModal.scss';

const ProjectModal = ({ project, onClose }) => {
  if (!project) return null;

  const links = [
    { label: 'Live', href: project.liveUrl },
    { label: 'Demo', href: project.demoUrl },
    { label: 'Code', href: project.codeUrl },
  ].filter((link) => Boolean(link.href));

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

        <div className="modal-body">
          <h2 id="project-modal-title" className="modal-title">
            {project.title}
          </h2>

          <div className="modal-tech-block">
            <span className="modal-tech-label">Tech</span>
            <ul className="modal-tech-list">
              {(project.tech || []).map((item) => (
                <li key={`${project.id}-${item}`} className="modal-tech-item">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {links.length > 0 && (
            <div className="modal-actions">
              {links.map((link) => (
                <a
                  key={`${project.id}-${link.label}`}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="modal-link"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
