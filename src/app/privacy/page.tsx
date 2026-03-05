export default function Privacy() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-slate-300 relative z-10">
      <h1 className="text-2xl font-bold text-white mb-8">Política de Privacidad</h1>
      <p className="text-sm text-slate-400 mb-6">Última actualización: Marzo 2026</p>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-white mb-2">1. Datos que recopilamos</h2>
          <p>Esta aplicación accede a datos de rendimiento publicitario (campañas, métricas, gastos) a través de las APIs de Meta Ads y MercadoLibre Ads, exclusivamente con el propósito de mostrar reportes y análisis al titular de la cuenta.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">2. Uso de los datos</h2>
          <p>Los datos se utilizan únicamente para:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Mostrar métricas de rendimiento de campañas publicitarias</li>
            <li>Generar recomendaciones automatizadas de optimización</li>
            <li>Análisis mediante asistente AI integrado</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">3. Almacenamiento</h2>
          <p>No almacenamos datos personales de usuarios finales. Los tokens de acceso se guardan de forma encriptada y se utilizan exclusivamente para consultar las APIs de las plataformas publicitarias.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">4. Compartición de datos</h2>
          <p>No compartimos, vendemos ni transferimos datos a terceros bajo ninguna circunstancia.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">5. Eliminación de datos</h2>
          <p>Podés solicitar la eliminación de todos tus datos en cualquier momento a través de nuestra <a href="/data-deletion" className="text-blue-400 hover:underline">página de eliminación de datos</a> o contactándonos directamente.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">6. Contacto</h2>
          <p>Para consultas sobre privacidad: <a href="mailto:henai.hh@gmail.com" className="text-blue-400 hover:underline">henai.hh@gmail.com</a></p>
        </section>
      </div>
    </div>
  );
}
