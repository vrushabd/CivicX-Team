"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Loader2 } from "lucide-react"
import { updateUserProfile } from "@/lib/data-service"
import { toast } from "sonner" // Assuming sonner is used, or fallback to alert

export function ProfileModal({ userEmail, currentName, onUpdate }) {
    const [isOpen, setIsOpen] = useState(false)
    const [name, setName] = useState(currentName || "")
    const [isLoading, setIsLoading] = useState(false)

    const handleUpdate = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            await updateUserProfile(userEmail, { fullName: name })
            onUpdate(name)
            setIsOpen(false)
            // If we had a toast library, we'd use it here. For now, silent success or handle in parent.
        } catch (error) {
            console.error("Failed to update profile", error)
            alert("Failed to update profile. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Make changes to your profile here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdate} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right text-slate-300">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3 bg-slate-900 border-slate-600 text-white focus:ring-emerald-500"
                            placeholder="Your Full Name"
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
