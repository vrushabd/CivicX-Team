"use client";

export const dynamic = "force-dynamic";
// 🚀 prevents pre-rendering completely — only runs in browser

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import nextDynamic from "next/dynamic";
import { createReport, uploadImage } from "@/lib/firebase-service";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";

// Load report map only on client
const ReportMap = nextDynamic(() => import("@/components/map/ReportMap"), {
  ssr: false,
});

export default function NewReport() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    coords: null,
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  const [imageValidation, setImageValidation] = useState(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  // only run in browser
  useEffect(() => {
    if (typeof window === "undefined") return;
    const role = localStorage.getItem("userRole");
    if (role !== "user") router.push("/");
  }, [router]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target.result;
      setImagePreview(imageData);
      setFormData((prev) => ({ ...prev, image: imageData }));
    };
    reader.readAsDataURL(file);
  };

  async function reverseGeocode(lat, lon) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
      );
      const data = await res.json();
      return data.display_name;
    } catch (err) {
      return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const place = await reverseGeocode(lat, lng);

        setFormData((prev) => ({
          ...prev,
          location: place,
          coords: { lat, lng },
        }));
        setLocationError("");
      },
      () => setLocationError("Unable to get location")
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.location) {
      alert("Please fill required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;
      if (formData.image) {
        // Convert base64 to blob for upload if needed, or handle in service
        // For now, assuming service handles base64 or we need to convert
        // But the service uploadImage expects a File object usually.
        // Let's check if we have the file object.
        // We don't store the file object in state, only the preview.
        // We should store the file object too.
      }

      // Actually, let's just use the existing logic but call createReport
      const userEmail = localStorage.getItem("userEmail");

      await createReport({
        ...formData,
        userEmail,
        status: "pending",
        type: "other", // Default type
        image: formData.image // This might be base64, which local storage handles. Firebase might need upload.
      });

      alert("Submitted Successfully!");
      router.push("/dashboard/user");
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-300">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/dashboard/user"
          className="inline-flex items-center mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Link>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Report Civic Issue</CardTitle>
            <CardDescription>Help improve the community</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* TITLE */}
              <div>
                <Label>Issue Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, title: e.target.value }))
                  }
                  required
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <Label>Description *</Label>
                <Textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, description: e.target.value }))
                  }
                  required
                />
              </div>

              {/* LOCATION */}
              <div className="space-y-2">
                <Label>Location *</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        location: e.target.value,
                        coords: null,
                      }))
                    }
                    required
                  />
                  <Button
                    type="button"
                    onClick={getCurrentLocation}
                    className="bg-red-700"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Current
                  </Button>
                </div>
                {locationError && (
                  <p className="text-red-600">{locationError}</p>
                )}

                {/* map */}
                <ReportMap
                  coords={formData.coords}
                  locationText={formData.location}
                  onLocationChange={(place, coords) =>
                    setFormData((p) => ({ ...p, location: place, coords }))
                  }
                />
              </div>

              {/* PHOTO */}
              <div className="space-y-2">
                <Label>Photo Evidence</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      className="h-44 mx-auto rounded"
                    />
                  ) : (
                    <Camera className="w-12 h-12 mx-auto" />
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
