export default function GrafanaEmbed() {
    return (
      <div>
        <h2>Grafana Analytics</h2>
        <iframe
          src="http://localhost:3001/d/your-dashboard-id"
          width="100%"
          height="600"
          frameBorder="0"
          title="Grafana Dashboard"
        />
      </div>
    );
  }