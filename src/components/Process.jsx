import { processSteps } from "../content/siteContent.js";

export function Process() {
  return <section className="process-section" aria-labelledby="process-title"><div className="process-heading"><p className="eyebrow">o processo</p><h2 id="process-title">O calor deixa<br />sua <i>assinatura.</i></h2></div><ol className="process-list">{processSteps.map((step, index) => <li key={step.title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></li>)}</ol></section>;
}
