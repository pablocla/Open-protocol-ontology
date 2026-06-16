import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="La capa semántica universal que conecta sistemas ERP con Inteligencia Artificial.">
      <main className="opo-hero">
        <h1 style={{fontSize: '3.5rem', fontWeight: 'bold', margin: '0 0 1rem 0', color: '#f8fafc'}}>
          Open Protocol Ontology <span style={{color: '#10b981'}}>(OPO)</span>
        </h1>
        <p style={{fontSize: '1.5rem', color: '#cbd5e1', maxWidth: '600px', margin: '0 auto 2.5rem auto', lineHeight: '1.4'}}>
          {siteConfig.tagline}
        </p>
        <div style={{marginBottom: '1rem'}}>
          <Link
            className="button button--primary button--lg"
            to="/docs/intro"
            style={{
              padding: '0.8rem 2rem',
              fontSize: '1.1rem',
              borderRadius: '8px',
              backgroundColor: '#10b981',
              borderColor: '#10b981',
              fontWeight: 'bold',
              color: '#070707',
            }}>
            Empezar Documentación →
          </Link>
        </div>

        <div className="opo-cards-container">
          <div className="opo-card">
            <h3>💡 Ontología Universal</h3>
            <p>Estandariza bases de datos y APIs complejas (ej. SAP, Protheus) bajo un vocabulario semántico que las IAs entienden de forma nativa.</p>
          </div>
          <div className="opo-card">
            <h3>🎨 OPO Studio</h3>
            <p>Diseña tu arquitectura de datos y coordina agentes de IA (Swarm) en un lienzo visual de bajo código pensado para consultores funcionales.</p>
          </div>
          <div className="opo-card">
            <h3>🤖 Empleados Virtuales</h3>
            <p>Despliega agentes autónomos especializados (Auditoría, Inventario, Conciliación) conectados directamente a tus sistemas de gestión.</p>
          </div>
        </div>
      </main>
    </Layout>
  );
}
