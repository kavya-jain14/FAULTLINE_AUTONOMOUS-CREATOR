import { BookOpenCheck, Radar, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: Radar,
    number: "01",
    title: "Find live signals",
    copy: "Mira checks trusted AI and security sources on a schedule—no new prompt required.",
  },
  {
    icon: ShieldCheck,
    number: "02",
    title: "Judge before writing",
    copy: "She rejects weak, repeated, or low-impact topics and only continues above her editorial bar.",
  },
  {
    icon: BookOpenCheck,
    number: "03",
    title: "Remember and publish",
    copy: "She checks earlier coverage, then adds a sourced note with a plain-language reason for publishing.",
  },
] as const;

export function HowItWorks(): React.JSX.Element {
  return (
    <section className="product-guide" aria-labelledby="product-guide-title">
      <header className="guide-intro">
        <span className="panel-kicker">How FAULTLINE works</span>
        <h2 id="product-guide-title">Mira turns live technical noise into a feed worth reading.</h2>
        <p>
          This dashboard is a window into an autonomous editor. After one setup,
          Mira keeps working in the background—even when nobody has this page open.
        </p>
      </header>

      <ol className="guide-steps">
        {steps.map(({ icon: Icon, number, title, copy }) => (
          <li key={number}>
            <div className="guide-step-icon" aria-hidden="true">
              <Icon />
            </div>
            <div>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
