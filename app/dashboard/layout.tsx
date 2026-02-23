import Link from "next/link"

function NavItem({
  href,
  label
}: {
  href: string
  label: string
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/70"
    >
      {label}
    </Link>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
          <aside className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="mb-4">
              <div className="text-base font-semibold">Mangialoqui</div>
              <div className="text-xs text-slate-400">Dashboard gestore</div>
            </div>

            <div className="space-y-1">
              <NavItem href="/dashboard/customers" label="Clienti" />
              <NavItem href="/dashboard/messages" label="Messaggi" />
            </div>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/30 p-3">
              <div className="text-xs font-semibold text-slate-300">Filtro ristorante</div>
              <div className="mt-1 text-xs text-slate-400">
                Aggiungi <span className="font-mono">?r=slug</span> agli URL
              </div>
            </div>
          </aside>

          <main className="rounded-2xl border border-slate-800 bg-slate-900/20 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
