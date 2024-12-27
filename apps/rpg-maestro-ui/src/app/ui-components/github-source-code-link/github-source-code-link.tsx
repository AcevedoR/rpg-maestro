import React from "react";
import "./github-source-code-link.css"; // Import the CSS file

const GitHubLink = () => {
  return (
    <div className="github-link-container">
      <a
        href="https://github.com/AcevedoR/rpg-maestro"
        target="_blank"
        rel="noopener noreferrer"
        className="github-link"
      >
        {/* Inline SVG for GitHub Logo  */}
        <svg
          className="github-logo"
          viewBox="0 0 16 16"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M8 0C3.58 0 0 3.659 0 8.168c0 3.613 2.29 6.675 5.47 7.756.4.074.547-.178.547-.396 0-.196-.007-.717-.01-1.407-2.226.492-2.695-1.088-2.695-1.088-.364-.933-.89-1.181-.89-1.181-.727-.508.056-.497.056-.497.805.057 1.228.841 1.228.841.715 1.252 1.873.89 2.329.68.073-.534.28-.89.508-1.094-1.777-.205-3.644-.918-3.644-4.089 0-.903.317-1.641.84-2.22-.084-.206-.364-1.03.08-2.146 0 0 .67-.218 2.2.84.638-.181 1.322-.272 2.004-.276.682.004 1.366.095 2.005.276 1.53-1.058 2.2-.84 2.2-.84.444 1.116.164 1.94.08 2.146.524.58.84 1.317.84 2.22 0 3.18-1.868 3.882-3.65 4.082.287.252.54.75.54 1.51 0 1.09-.01 1.966-.01 2.234 0 .22.145.476.55.395C13.71 14.84 16 11.78 16 8.168 16 3.659 12.42 0 8 0z"/>
        </svg>
        <span className="github-link-text">View source code</span>
      </a>
    </div>
  );
};

export default GitHubLink;