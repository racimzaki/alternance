type KpiCardProps = {
  label: string;
  value: string | number;
  icon: string;
};

function KpiCard({ label, value, icon }: KpiCardProps) {
  return (
    <article className="kpi-card">
      <span className="kpi-icon">{icon}</span>

      <strong>{value}</strong>

      <p>{label}</p>
    </article>
  );
}

export default KpiCard;
