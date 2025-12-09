import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Users, Wrench, Leaf } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900">
      <header className="border-b border-slate-700 bg-slate-800/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-black" />
            </div>
            <span className="text-lg font-semibold text-white">PickUpNow</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4 text-balance">Garbage Collection Report System</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto text-pretty">
            Report garbage collection issues in your area. Help keep your community clean.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <Card className="text-center hover:shadow-lg transition-shadow bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
              <CardTitle className="text-white">Citizen Portal</CardTitle>
              <CardDescription className="text-slate-300" style={{ paddingBottom: "16px" }}>
                Report garbage issues in your area
              </CardDescription>

            </CardHeader>
            <CardContent>
              <Link href="/login/user">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Login as Citizen</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <CardTitle className="text-white">Admin Portal</CardTitle>
              <CardDescription className="text-slate-300">
                Manage reports and complete garbage collection tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login/admin">
                <Button variant="secondary" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
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
