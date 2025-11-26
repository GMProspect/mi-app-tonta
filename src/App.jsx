import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [quejas, setQuejas] = useState([])
  const [nuevaQueja, setNuevaQueja] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // 1. Cargar las quejas al iniciar y suscribirse a cambios
  useEffect(() => {
    fetchQuejas()

    // Suscripción a Realtime
    const channel = supabase
      .channel('realtime:quejas')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quejas' }, (payload) => {
        setQuejas((prev) => [payload.new, ...prev])
      })
      .on('broadcast', { event: 'typing' }, () => {
        setIsTyping(true)
        setTimeout(() => setIsTyping(false), 3000)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchQuejas = async () => {
    try {
      const { data, error } = await supabase
        .from('quejas')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching quejas:', error)
        return
      }

      if (data) {
        setQuejas(data)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
    }
  }

  // 2. Enviar una queja
  const enviarQueja = async (e) => {
    e.preventDefault()
    if (!nuevaQueja) return

    await supabase
      .from('quejas')
      .insert([{ texto: nuevaQueja }])

    setNuevaQueja('')
    // No necesitamos fetchQuejas() porque la suscripción lo actualizará
  }

  const handleTyping = async (e) => {
    setNuevaQueja(e.target.value)
    await supabase.channel('realtime:quejas').send({
      type: 'broadcast',
      event: 'typing',
    })
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-8 text-pink-500">😡 Muro de Quejas</h1>

      {/* Formulario */}
      <form onSubmit={enviarQueja} className="w-full max-w-md flex gap-2 mb-10">
        <input
          type="text"
          value={nuevaQueja}
          onChange={handleTyping}
          placeholder="¿De qué te quieres quejar hoy?"
          className="flex-1 p-3 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-pink-500"
        />
        <button type="submit" className="bg-pink-600 px-6 py-3 rounded font-bold hover:bg-pink-700 transition">
          Gritar
        </button>
      </form>

      {/* Indicador de escribiendo */}
      {isTyping && (
        <p className="text-pink-400 text-sm mb-4 animate-pulse">
          Alguien está escribiendo su furia...
        </p>
      )}

      {/* Lista de Quejas */}
      <div className="w-full max-w-md space-y-4">
        {quejas.map((queja) => (
          <div key={queja.id} className="bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-blue-500">
            <p className="text-lg">{queja.texto}</p>
            <span className="text-xs text-gray-500">
              {new Date(queja.created_at).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App