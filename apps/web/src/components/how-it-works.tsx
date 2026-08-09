const steps = [
  {
    verb: "Scans",
    title: "live evidence",
    copy: "Primary AI and security sources, on a schedule.",
  },
  {
    verb: "Challenges",
    title: "the claim",
    copy: "Evidence, builder consequence, freshness and editorial fit.",
  },
  {
    verb: "Remembers",
    title: "prior coverage",
    copy: "Repeated topics stay out; the strongest new signal becomes a sourced note.",
  },
] as const;

export function HowItWorks(): React.JSX.Element {
  return (
    <section className="product-guide" aria-labelledby="product-guide-title">
      <header className="guide-intro">
        <span className="panel-kicker">The editorial method</span>
        <h2 id="product-guide-title">A feed shaped by decisions, not volume.</h2>
        <p>
          <strong>MIRA</strong> means Machine Intelligence for Reliability &amp;
          Assurance. Initialize the editor once, read Published notes for sourced
          action, and open Topics skipped to audit what it chose not to amplify.
        </p>
      </header>

      <div className="guide-steps">
        {steps.map(({ verb, title, copy }) => (
          <article key={verb}>
            <div>
              <strong>{verb}</strong>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          </article>
        ))}
      </div>

      <blockquote className="builder-note">
        “Most feeds reward recency. I wanted one that could stay quiet when the
        builder action had not changed.”
        <cite>— Kavya, build note</cite>
      </blockquote>
    </section>
  );
}
