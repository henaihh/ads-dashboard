export default function DataDeletion() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-slate-300 relative z-10">
      <h1 className="text-2xl font-bold text-white mb-8">Eliminación de Datos de Usuario</h1>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-white mb-2">Cómo eliminar tus datos</h2>
          <p>Si deseás que eliminemos todos los datos asociados a tu cuenta, podés hacerlo de las siguientes maneras:</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">Opción 1: Por email</h2>
          <p>Enviá un email a <a href="mailto:henai.hh@gmail.com" className="text-blue-400 hover:underline">henai.hh@gmail.com</a> con el asunto &ldquo;Eliminación de datos&rdquo; indicando tu cuenta. Procesaremos la solicitud dentro de las 48 horas.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">Opción 2: Desconectar la app</h2>
          <p>Podés revocar el acceso de esta aplicación directamente desde la configuración de tu cuenta en Meta o MercadoLibre. Al hacerlo, los tokens de acceso quedan invalidados y no podremos acceder a ningún dato.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">¿Qué datos eliminamos?</h2>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Tokens de acceso almacenados</li>
            <li>Datos de campañas cacheados</li>
            <li>Configuración de cuenta</li>
          </ul>
          <p className="mt-2">No almacenamos datos personales de usuarios finales ni información de pago.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">Contacto</h2>
          <p>Para cualquier consulta: <a href="mailto:henai.hh@gmail.com" className="text-blue-400 hover:underline">henai.hh@gmail.com</a></p>
        </section>
      </div>
    </div>
  );
}
