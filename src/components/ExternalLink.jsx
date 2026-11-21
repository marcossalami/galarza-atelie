import { instagramUrl } from "../content/siteContent.js";

export function ExternalLink({ children, className = "text-link", href = instagramUrl }) {
  return <a className={className} href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}
