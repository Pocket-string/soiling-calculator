export const dynamic = 'force-dynamic'

export default function TestPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Test Route Works!</h1>
      <p>If you see this, the route is in the build output.</p>
      <p>Time: {new Date().toISOString()}</p>
    </div>
  )
}
