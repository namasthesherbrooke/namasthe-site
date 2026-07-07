export default function Loading() {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      backgroundColor: '#Fdfcfb'
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { opacity: 0.4; }
        }
        .skeleton {
          background-color: #e0e0e0;
          border-radius: 8px;
          animation: pulse 1.5s infinite ease-in-out;
        }
      `}} />
      
      {/* Simulation d'un titre en train de charger */}
      <div className="skeleton" style={{ width: '60%', maxWidth: '400px', height: '40px', marginBottom: '30px', borderRadius: '20px' }}></div>
      
      {/* Simulation de texte en train de charger */}
      <div className="skeleton" style={{ width: '80%', maxWidth: '600px', height: '20px', marginBottom: '15px' }}></div>
      <div className="skeleton" style={{ width: '70%', maxWidth: '500px', height: '20px', marginBottom: '40px' }}></div>

      {/* Simulation d'une grille ou d'éléments visuels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', width: '100%', maxWidth: '900px' }}>
        <div className="skeleton" style={{ height: '250px', borderRadius: '16px' }}></div>
        <div className="skeleton" style={{ height: '250px', borderRadius: '16px' }}></div>
        <div className="skeleton" style={{ height: '250px', borderRadius: '16px' }}></div>
      </div>
    </div>
  )
}
