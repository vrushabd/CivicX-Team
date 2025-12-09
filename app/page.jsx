import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Users, Wrench, Leaf } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-white selection:bg-emerald-500/30">
      <header className="fixed w-full z-50 top-0 border-b border-white/5 bg-slate-900/80 backdrop-blur-md transition-all duration-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">PickUpNow</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 pt-32 pb-16 min-h-screen flex flex-col justify-center animate-in fade-in duration-700">
        <div className="text-center mb-20 space-y-6">
          <div className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            For Cleaner Communities
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 text-balance tracking-tight leading-tight">
            Garbage Collection <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Simplified.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto text-pretty leading-relaxed">
            Report issues instantly, track resolution in real-time, and help keep your neighborhood pristine with our smart civic reporting tool.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full px-4">
          <Card className="group relative overflow-hidden bg-slate-800/40 border-white/5 hover:border-emerald-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="text-center pb-2 relative z-10">
              <div className="mx-auto w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-white/5 group-hover:border-emerald-500/30">
                <Users className="w-10 h-10 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-2">Citizen Portal</CardTitle>
              <CardDescription className="text-slate-400 text-lg">
                Report garbage issues in your area
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 pt-6">
              <Link href="/login/user">
                <Button className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 hover:shadow-emerald-500/20 transition-all duration-300 group-hover:scale-[1.02]">
                  Login as Citizen
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-slate-800/40 border-white/5 hover:border-blue-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="text-center pb-2 relative z-10">
              <div className="mx-auto w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-white/5 group-hover:border-blue-500/30">
                <Shield className="w-10 h-10 text-blue-400 group-hover:text-blue-300 transition-colors" />
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-2">Admin Portal</CardTitle>
              <CardDescription className="text-slate-400 text-lg">
                Manage reports and operations
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 pt-6">
              <Link href="/login/admin">
                <Button variant="secondary" className="w-full h-12 text-lg bg-slate-700 hover:bg-slate-600 text-white border-0 shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group-hover:scale-[1.02]">
                  Login as Admin
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
