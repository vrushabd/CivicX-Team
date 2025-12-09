"use client";

export const dynamic = "force-dynamic";
// 🚀 prevents pre-rendering completely — only runs in browser

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import nextDynamic from "next/dynamic";
import { createReport, uploadImage, createNotification } from "@/lib/data-service";
import { getImageForLocation } from "@/lib/location-images";

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
  Video,
} from "lucide-react";

const ReportMap = nextDynamic(() => import("@/components/map/ReportMap"), {
  ssr: false,
});
import LocationAutocomplete from "@/components/map/LocationAutocomplete";

export default function NewReport() {
  const [formData, setFormData] = useState({
    title: "",
    title: "",
    description: " ",
    location: "",
    location: "",
    coords: null,
    coords: null,
    imageFile: null,
    videoFile: null,
  });

  const [preselectedImageUrl, setPreselectedImageUrl] = useState(null);
  const [preselectedVideoUrl, setPreselectedVideoUrl] = useState(null);

  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const videoInputRef = useRef(null);
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

  const handleMediaUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("video/")) {
      setFormData((prev) => ({ ...prev, videoFile: file, imageFile: null }));
      setPreselectedImageUrl(null);
      setPreselectedVideoUrl(null);
      setImagePreview(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        setVideoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({ ...prev, imageFile: file, videoFile: null }));
      setPreselectedVideoUrl(null);
      setPreselectedImageUrl(null);
      setVideoPreview(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
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

    console.log("Form submission started");

    if (!formData.title || !formData.location) {
      alert("Please fill required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;

      // Use pre-selected image if available and no new file uploaded
      if (preselectedImageUrl && !formData.imageFile) {
        imageUrl = preselectedImageUrl;
      }

      // Upload image if one was selected (overrides pre-selected)
      if (formData.imageFile) {
        console.log("Attempting to upload image...");
        try {
          imageUrl = await uploadImage(formData.imageFile, "reports");
          console.log("Image uploaded successfully:", imageUrl);
        } catch (error) {
          console.error("Error uploading image:", error);
          // Continue even if image upload fails
        }
      }

      let videoUrl = null;

      // Use pre-selected video if available and no new file uploaded
      if (preselectedVideoUrl && !formData.videoFile) {
        videoUrl = preselectedVideoUrl;
      }

      if (formData.videoFile) {
        console.log("Attempting to upload video...");
        try {
          // We reuse uploadImage service as it handles generic file uploads to storage
          videoUrl = await uploadImage(formData.videoFile, "reports");
          console.log("Video uploaded successfully:", videoUrl);
        } catch (error) {
          console.error("Error uploading video:", error);
        }
      }

      // Get user email from localStorage
      const userEmail = localStorage.getItem("userEmail");
      console.log("User email:", userEmail);

      if (!userEmail) {
        alert("User email not found. Please login again.");
        router.push("/login");
        return;
      }

      // Create the report with all data
      const reportData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        coords: formData.coords,
        image: imageUrl, // Use the uploaded image URL
        video: videoUrl,
        userEmail,
        status: "pending",
        type: "garbage", // Garbage-specific app
      };

      console.log("Creating report with data:", reportData);

      const reportId = await createReport(reportData);

      console.log("Report created successfully with ID:", reportId);

      // Notify Admins
      await createNotification({
        type: "new_report",
        title: "New Report Submitted",
        message: `A new report "${formData.title}" has been submitted for ${formData.location}`,
        recipientRole: "admin", // Notify all admins
        reportId: reportId
      });

      alert("Report submitted successfully!");
      router.push("/dashboard/user");
    } catch (error) {
      console.error("Error submitting report:", error);
      console.error("Error details:", error.message, error.stack);
      alert(`Failed to submit report: ${error.message || "Please try again."}`);
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
            <CardTitle>Report Garbage Issue</CardTitle>
            <CardDescription>Help keep your community clean</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* TITLE */}
              <div className="space-y-2">
                <Label>Issue Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, title: e.target.value }))
                  }
                  required
                />
              </div>



              {/* LOCATION */}
              <div className="space-y-2">
                <Label>Location *</Label>
                <div className="flex gap-2">
                  <LocationAutocomplete
                    value={formData.location}
                    coords={formData.coords}
                    onChange={(val) =>
                      setFormData((p) => ({
                        ...p,
                        location: val,
                        // Don't clear coords immediately on typing, wait for select or manual map pick
                        // But if they type something new, coords might be stale. 
                        // Let's keep coords for now so map doesn't jump until they select valid one or click map
                      }))
                    }
                    onSelect={({ location, lat, lng }) => {
                      // Check for auto-image/video
                      const mediaUrl = getImageForLocation(location);
                      if (mediaUrl) {
                        const isVideo = mediaUrl.match(/\.(mp4|webm|ogg)$/i);

                        if (isVideo) {
                          setVideoPreview(mediaUrl);
                          setPreselectedVideoUrl(mediaUrl);
                          setPreselectedImageUrl(null);
                          setImagePreview(null);
                          setFormData(p => ({ ...p, videoFile: null }));
                        } else {
                          setImagePreview(mediaUrl);
                          setPreselectedImageUrl(mediaUrl);
                          setPreselectedVideoUrl(null);
                          setVideoPreview(null);
                          setFormData(p => ({ ...p, imageFile: null }));
                        }
                      }

                      setFormData(p => ({
                        ...p,
                        location,
                        coords: { lat, lng }
                      }))
                    }}
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

              {/* EVIDENCE SECTION - Consolidated */}
              <div className="space-y-2">
                <Label>Evidence (Photo or Video)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">

                  {/* Display Video Preview if active */}
                  {videoPreview && (
                    <video
                      src={videoPreview}
                      controls
                      className="w-full h-auto max-h-[500px] object-contain mx-auto rounded-lg mb-4 shadow-md bg-black"
                    />
                  )}

                  {/* Display Image Preview if active */}
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      className="w-full h-auto max-h-[500px] object-contain mx-auto rounded-lg mb-4 shadow-md"
                    />
                  )}

                  {/* Placeholder if nothing */}
                  {!videoPreview && !imagePreview && (
                    <div className="flex justify-center gap-4 mb-4">
                      <Camera className="w-12 h-12 text-gray-400" />
                      <Video className="w-12 h-12 text-gray-400" />
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Evidence
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
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
      </div >
    </div >
  );
}
