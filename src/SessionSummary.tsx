import React from "react";
import {
  buildSessionSummaryRows,
  type SessionCompletionSummary,
  type SessionSummaryLanguage,
} from "./sessionSummary";

export default function SessionSummary({
  summary,
  language,
}: {
  summary: SessionCompletionSummary;
  language: SessionSummaryLanguage;
}) {
  const rows = buildSessionSummaryRows(summary, language);
  const t = (nl: string, en: string) => language === "nl" ? nl : en;

  return (
    <section className="session-summary" aria-labelledby="session-summary-title">
      <div className="session-summary-heading">
        <span className="eyebrow">AFTER HOURS · SESSION SUMMARY</span>
        <h3 id="session-summary-title">{t("Jouw sessieoverzicht", "Your session summary")}</h3>
      </div>
      <dl className="session-summary-grid">
        {rows.map((row) => (
          <div className="session-summary-item" key={row.id}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="session-summary-privacy">
        {t(
          "De inhoud van je privénotitie wordt bewust niet in dit overzicht getoond. Dit overzicht blijft alleen zichtbaar op dit scherm en wordt niet apart opgeslagen.",
          "Your private note content is deliberately not shown here. This summary is only visible on this screen and is not stored separately.",
        )}
      </p>
    </section>
  );
}
