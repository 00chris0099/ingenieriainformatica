export default function Loading() {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-4 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Cargando pagina...</p>
      </div>
    </div>
  )
}
