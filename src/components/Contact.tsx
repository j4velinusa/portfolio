import { site } from "@/content/site";
import type { Lang } from "@/lib/i18n";

export function Contact({ lang }: { lang: Lang }) {
  return (
    <footer id="contact" className="contact">
      <h2 className="grad-text reveal">{site.contact.title[lang]}</h2>
      <p className="sub reveal">{site.contact.sub[lang]}</p>
      <div className="cbtns reveal">
        <a className="btn solid" href={`mailto:${site.links.email}`}>
          {site.links.email}
        </a>
        <a className="btn ghost" href={site.links.github} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a className="btn ghost" href={site.links.linkedin} target="_blank" rel="noreferrer">
          LinkedIn
        </a>
      </div>
      <div className="copyright">© 2026 {site.name}</div>
    </footer>
  );
}
