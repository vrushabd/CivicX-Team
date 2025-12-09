
"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Search, Loader2, MapPin } from "lucide-react"


// Inline debounce hook if not exists, but let's check first. 
// Actually, standard way is to just use a timer in useEffect or a utility.
// I'll stick to simple useEffect debounce.

export default function LocationAutocomplete({ value, onChange, onSelect, className, coords }) {
    const [query, setQuery] = useState(value || "")
    const [suggestions, setSuggestions] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const wrapperRef = useRef(null)

    // Update query if parent value changes externally (e.g. "Current Location" button)
    useEffect(() => {
        setQuery(value || "")
    }, [value])

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length < 3) {
                setSuggestions([])
                return
            }

            // Don't search if the query exactly matches the current value
            if (!isOpen) return

            setIsLoading(true)
            try {
                let searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=in`

                // Bias towards user location if available
                if (coords) {
                    // Create a rough viewbox around the user (approx +/- 0.5 deg)
                    const viewbox = `${coords.lng - 0.5},${coords.lat + 0.5},${coords.lng + 0.5},${coords.lat - 0.5}`
                    searchUrl += `&viewbox=${viewbox}&bounded=0`
                }

                const res = await fetch(searchUrl, {
                    headers: {
                        "User-Agent": "CivicReportApp/1.0"
                    }
                }
                )
                const data = await res.json()
                setSuggestions(data)
            } catch (error) {
                console.error("Search failed:", error)
                setSuggestions([])
            } finally {
                setIsLoading(false)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [query, isOpen])

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleInputChange = (e) => {
        const newVal = e.target.value
        setQuery(newVal)
        onChange(newVal)
        setIsOpen(true)
    }

    const handleSelect = (item) => {
        const displayName = item.display_name
        setQuery(displayName)
        setIsOpen(false)

        onSelect({
            location: displayName,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
        })
    }

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <div className="relative">
                <Input
                    value={query}
                    onChange={handleInputChange}
                    placeholder="Search for a location..."
                    className="pr-10 text-white bg-slate-700 border-slate-600 focus:ring-emerald-500"
                    onFocus={() => setIsOpen(true)}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Search className="h-4 w-4" />
                    )}
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-[1100] w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {suggestions.length > 0 ? (
                        suggestions.map((item) => (
                            <button
                                key={item.place_id}
                                type="button" // Prevent form submission
                                className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-start gap-2 text-sm transition-colors text-slate-900"
                                onClick={() => handleSelect(item)}
                            >
                                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-slate-500" />
                                <span>{item.display_name}</span>
                            </button>
                        ))
                    ) : (
                        !isLoading && query.length >= 3 && (
                            <div className="p-4 text-sm text-slate-500 text-center">
                                No locations found
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    )
}
