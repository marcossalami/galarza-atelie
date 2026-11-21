import { instagramUrl } from "../content/siteContent.js";

export function ExternalLink({ children, className = "text-link" }) {
  return <a className={className} href={instagramUrl} target="_blank" rel="noopener noreferrer">{children}</a>;
}
