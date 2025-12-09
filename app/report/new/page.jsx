"use client";

export const dynamic = "force-dynamic";
// 🚀 prevents pre-rendering completely — only runs in browser

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import nextDynamic from "next/dynamic";
import { createReport, uploadImage, createNotification } from "@/lib/data-service";

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
    <div className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black">
      <div className="container mx-auto px-4 py-8 max-w-2xl animate-in fade-in zoom-in duration-500">
        <Link
          href="/dashboard/user"
          className="inline-flex items-center mb-8 text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        <Card className="bg-slate-900/40 backdrop-blur-xl border-white/10 shadow-2xl shadow-emerald-900/20 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-50" />
          <CardHeader className="relative z-10 border-b border-white/5 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white tracking-tight">Report Issue</CardTitle>
            </div>
            <CardDescription className="text-slate-400 text-base">
              Submit a new garbage collection report to help keep your community clean.
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10 pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* TITLE */}
              <div className="space-y-2">
                <Label className="text-slate-300 ml-1">Issue Title <span className="text-red-400">*</span></Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="e.g., Overflowing dumpster on Main St"
                  className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-11"
                  required
                />
              </div>

              {/* LOCATION */}
              <div className="space-y-2">
                <Label className="text-slate-300 ml-1">Location <span className="text-red-400">*</span></Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <LocationAutocomplete
                      value={formData.location}
                      coords={formData.coords}
                      onChange={(val) =>
                        setFormData((p) => ({
                          ...p,
                          location: val,
                        }))
                      }
                      onSelect={({ location, lat, lng }) => {
                        setFormData(p => ({
                          ...p,
                          location,
                          coords: { lat, lng }
                        }))
                      }}
                      className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-11 w-full rounded-md px-3"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={getCurrentLocation}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"
                    title="Use Current Location"
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>

                {locationError && (
                  <p className="text-red-400 text-sm flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                    <AlertTriangle className="w-3 h-3" /> {locationError}
                  </p>
                )}

                {/* map container */}
                <div className="rounded-xl overflow-hidden border border-white/10 shadow-inner mt-2">
                  <ReportMap
                    coords={formData.coords}
                    locationText={formData.location}
                    onLocationChange={(place, coords) =>
                      setFormData((p) => ({ ...p, location: place, coords }))
                    }
                  />
                </div>
              </div>

              {/* EVIDENCE SECTION */}
              <div className="space-y-2">
                <Label className="text-slate-300 ml-1">Evidence (Photo or Video)</Label>
                <div className="border-2 border-dashed border-white/10 bg-slate-950/30 rounded-xl p-8 text-center hover:border-emerald-500/30 transition-colors group">

                  {/* Previews */}
                  {videoPreview ? (
                    <div className="relative inline-block">
                      <video
                        src={videoPreview}
                        controls
                        className="w-full h-auto max-h-[400px] object-contain rounded-lg shadow-lg border border-white/10 bg-black"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => { setVideoPreview(null); setPreselectedVideoUrl(null); setFormData(p => ({ ...p, videoFile: null })) }}
                        className="absolute top-2 right-2 rounded-full h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </Button>
                    </div>
                  ) : imagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        className="w-full h-auto max-h-[400px] object-contain rounded-lg shadow-lg border border-white/10"
                        alt="Preview"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => { setImagePreview(null); setPreselectedImageUrl(null); setFormData(p => ({ ...p, imageFile: null })) }}
                        className="absolute top-2 right-2 rounded-full h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </Button>
                    </div>
                  ) : (
                    <div className="py-8 flex flex-col items-center justify-center gap-4 text-slate-500 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="flex gap-4">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-300 group-hover:border-emerald-500/30">
                          <Camera className="w-8 h-8 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                        </div>
                        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-300 group-hover:border-emerald-500/30 delay-75">
                          <Video className="w-8 h-8 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                        </div>
                      </div>
                      <p className="text-sm font-medium">Click to upload photo or video</p>
                    </div>
                  )}

                  {!videoPreview && !imagePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                      className="mt-4 bg-slate-800/50 border-white/10 text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Select File
                    </Button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 hover:shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] text-lg font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting Report...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Submit Report
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div >
    </div >
  );
}
