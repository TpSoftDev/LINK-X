"use client";

import { useState, useEffect } from "react";
import { Plus, LayoutDashboard } from "lucide-react";
import Link from "next/link";

import Sidebar from "@/components/dashboard/DashSidebar";
import UploadAudio from "@/components/dashboard/AudioUpload";
import { Button } from "@/components/ui/button";
import Footer from "@/components/landing/Footer";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CourseCard } from "@/components/dashboard/CourseCard";
import { CourseForm } from "@/components/dashboard/CourseForm";
import UploadPdf from "@/components/dashboard/UploadPDF";

export default function ProfessorDashboard() {
  type Course = {
    id: string;
    title: string;
    description?: string;
    code: string;
    term: string;
    published: boolean;
    lastUpdated: string;
    accessCode: string;
    students: number;
  };

  interface Student {
    id: string;
    name: string;
    email: string;
    enrolledAt: string;
    enrollmentId: string;
  }
  type FileSummary = {
    id: string;
    title: string;
    filename: string;
  };

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "home" | "modules" | "people" | "settings"
  >("home");
  const [editedCourse, setEditedCourse] = useState<Course | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [uploadingModuleId, setUploadingModuleId] = useState<string | null>(
    null
  );
  const [uploadingAudioModuleId, setUploadingAudioModuleId] = useState<
    string | null
  >(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ content: string }[]>([]);
  const [modules, setModules] = useState<
    { id: string; title: string; files: { id: string; title: string }[] }[]
  >([]);
  const [loadingFilesModuleId, setLoadingFilesModuleId] = useState<
    string | null
  >(null);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [confirmingDeleteStudentId, setConfirmingDeleteStudentId] = useState<
    string | null
  >(null);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  const [moduleFiles, setModuleFiles] = useState<Record<string, FileSummary[]>>(
    {}
  );
  const [previewingFile, setPreviewingFile] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
      if (!selectedCourse) return;
      try {
        const res = await fetch(
          `http://localhost:8080/instructor/courses/${selectedCourse.id}/modules`,
          {
            credentials: "include",
          }
        );
        const data = await res.json();

        if (Array.isArray(data)) {
          setModules(data);
        } else if (Array.isArray(data.modules)) {
          setModules(data.modules);
        } else {
          console.error("Unexpected module format:", data);
          setModules([]); // fallback
        }
      } catch (err) {
        console.error("Error fetching modules:", err);
        setModules([]); // fallback
      }
    };

    fetchModules();
  }, [selectedCourse]);

  useEffect(() => {
    const fetchEnrolledStudents = async () => {
      if (activeTab !== "people" || !selectedCourse?.id) return;

      setLoadingStudents(true);

      try {
        const res = await fetch(
          `http://localhost:8080/instructor/courses/${selectedCourse.id}/students`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to fetch students");

        const students = await res.json();
        const formatted = students.map((s: any) => ({
          id: s.userId,
          name: s.name,
          email: s.email,
          enrolledAt: s.enrolledAt,
          enrollmentId: s.enrollmentId,
        }));

        setEnrolledStudents(formatted);
      } catch (err) {
        console.error("Error fetching enrolled students:", err);
        setEnrolledStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchEnrolledStudents();
  }, [activeTab, selectedCourse]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("http://localhost:8080/instructor/courses", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch courses");
        const data = await res.json();
        setCourses(data);
      } catch (err) {
        console.error("Error fetching courses:", err);
      }
    };

    fetchCourses();

    if (selectedCourse) {
      setEditedCourse(selectedCourse);
    }
  }, [selectedCourse]);

  const handleAddModule = async () => {
    if (!selectedCourse) return;

    try {
      const res = await fetch(
        `http://localhost:8080/instructor/courses/${selectedCourse.id}/modules`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newModuleTitle }),
          credentials: "include", // important if session/cookie-based auth
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add module");

      setModules((prev) => [...prev, data]);
      setNewModuleTitle("");
    } catch (err) {
      console.error("Add module failed:", err);
      alert("Error adding module");
    }
  };

  const handleUploadPdf = async (
    courseId: string,
    file: File,
    moduleId: string
  ) => {
    try {
      setUploadingModuleId(moduleId);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `http://localhost:8080/instructor/modules/${moduleId}/files`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      if (!res.ok) {
        toast.error("Upload failed");
        return;
      }

      toast.success("Uploaded!");

      // ✅ fetch just this module’s files again
      const updatedFilesRes = await fetch(
        `http://localhost:8080/instructor/modules/${moduleId}/files`,
        {
          credentials: "include",
        }
      );

      if (!updatedFilesRes.ok) {
        console.error("Failed to fetch updated files for module");
        return;
      }

      const updatedFiles = await updatedFilesRes.json();

      setModuleFiles((prev) => ({
        ...prev,
        [moduleId]: updatedFiles,
      }));
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload error");
    } finally {
      setUploadingModuleId(null);
    }
  };

  const handleUploadAudio = async (
    courseId: string,
    file: File,
    moduleId: string
  ) => {
    try {
      setUploadingAudioModuleId(moduleId);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);

      const res = await fetch(
        `http://localhost:8080/instructor/modules/${moduleId}/files`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      // if (!res.ok) {
      //   toast.error("Audio upload failed");
      //   return;
      // }

      toast.success("Audio uploaded!");

      const updatedFilesRes = await fetch(
        `http://localhost:8080/instructor/modules/${moduleId}/files`,
        {
          credentials: "include",
        }
      );

      if (!updatedFilesRes.ok) return;

      const updatedFiles = await updatedFilesRes.json();

      setModuleFiles((prev) => ({
        ...prev,
        [moduleId]: updatedFiles,
      }));
    } catch (error) {
      console.error("Audio upload error:", error);
      toast.error("Audio upload error");
    } finally {
      setUploadingAudioModuleId(null);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm("Are you sure you want to delete this module?")) return;

    try {
      const res = await fetch(
        `http://localhost:8080/instructor/modules/${moduleId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Failed to delete module");
      setModules((prev) => prev.filter((mod) => mod.id !== moduleId));
    } catch (err) {
      console.error("Error deleting module:", err);
      toast.error("Could not delete module");
    }
  };

  const handleDeleteFile = async (fileId: string, moduleId: string) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      const res = await fetch(
        `http://localhost:8080/instructor/files/${fileId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Failed to delete file");
      setModuleFiles((prev) => ({
        ...prev,
        [moduleId]: prev[moduleId].filter((file) => file.id !== fileId),
      }));
    } catch (err) {
      console.error("Error deleting file:", err);
      toast.error("Could not delete file");
    }
  };

  const filteredCourses = courses
  .filter(
    (course): course is Course =>
      !!course &&
      typeof course.title === "string" &&
      typeof course.code === "string"
  )
  .filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCourse = async (newCourse: any) => {
    try {
      const res = await fetch("http://localhost:8080/instructor/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: newCourse.title,
          description: newCourse.description,
          code: newCourse.code,
          term: newCourse.term,
          published: newCourse.published ?? false,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create course");
      }

      // 🔄 Re-fetch all courses after successful creation
      const updatedRes = await fetch(
        "http://localhost:8080/instructor/courses",
        {
          credentials: "include",
        }
      );
      if (!updatedRes.ok) throw new Error("Failed to refresh course list");

      const updatedCourses = await updatedRes.json();
      setCourses(updatedCourses);

      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Failed to create course:", error);
    }
  };

  const handleDeleteCourse = async (deletedCourse: any) => {
    try {
      const res = await fetch(
        `http://localhost:8080/instructor/courses/${deletedCourse.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Failed to delete course");

      setCourses((prev) => prev.filter((c) => c.id !== deletedCourse.id));
      setSelectedCourse(null); // Navigates back to dashboard view
    } catch (err) {
      console.error("Delete failed:", err);
      // Optionally toast error here
    }
  };

  const handleUpdateCourseInfo = async (updatedCourse: any) => {
    try {
      const res = await fetch(
        `http://localhost:8080/instructor/courses/${updatedCourse.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title: updatedCourse.title,
            description: updatedCourse.description,
            code: updatedCourse.code,
            term: updatedCourse.term,
            published: updatedCourse.published,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update course");
      }

      const newTimestamp = new Date().toISOString();

      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course.id === updatedCourse.id
            ? { ...course, ...updatedCourse, lastUpdated: newTimestamp }
            : course
        )
      );

      setEditedCourse((prev) =>
        prev ? { ...prev, ...updatedCourse, lastUpdated: newTimestamp } : null
      );

      setEditingCourse(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000); // 3 seconds is better
    } catch (error) {
      console.error("Failed to update course:", error);
    }
  };

  const handlePublishToggle = async (id: string) => {
    const course = courses.find((c) => c.id === id);
    if (!course) return;

    const newStatus = !course.published;

    try {
      const res = await fetch(
        `http://localhost:8080/instructor/courses/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ published: newStatus }),
        }
      );

      if (!res.ok) throw new Error("Failed to update publish status");

      const newTimestamp = new Date().toISOString();

      setCourses((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, published: newStatus, lastUpdated: newTimestamp }
            : c
        )
      );

      if (editedCourse && editedCourse.id === id) {
        setEditedCourse((prev) =>
          prev
            ? { ...prev, published: newStatus, lastUpdated: newTimestamp }
            : null
        );
      }
    } catch (error) {
      console.error("Error updating publish status:", error);
    }
  };

  const handleCourseClick = async (course: any) => {
    try {
      const res = await fetch(
        `http://localhost:8080/instructor/courses/${course.id}/details`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch course details");
      }

      const details = await res.json();

      setSelectedCourse({
        ...course,
        description: details.description,
        accessCode: details.accessCode,
        students: details.students,
        lastUpdated: details.lastUpdated,
        published: details.published,
      });
    } catch (err) {
      console.error("Error fetching course details:", err);
      setSelectedCourse({ ...course, accessCode: "N/A", students: 0 });
    }
  };

  const handleBackToDashboard = () => {
    setSelectedCourse(null);
  };

  const handleDeleteStudent = async (enrollmentId: string) => {
    try {
      const res = await fetch(
        `http://localhost:8080/instructor/enrollments/${enrollmentId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Failed to delete student");

      setEnrolledStudents((prev) =>
        prev.filter((s: any) => s.enrollmentId !== enrollmentId)
      );
      setConfirmingDeleteStudentId(null);
    } catch (err) {
      console.error("Error deleting student:", err);
    }
  };

  const handleToggleModule = async (modId: string) => {
    if (selectedModuleId === modId) {
      setSelectedModuleId(null);
    } else {
      setSelectedModuleId(modId);

      if (!moduleFiles[modId]) {
        setLoadingFilesModuleId(modId); // start loading

        try {
          const res = await fetch(
            `http://localhost:8080/instructor/modules/${modId}/files`,
            {
              credentials: "include",
            }
          );

          const data = await res.json();
          if (Array.isArray(data)) {
            setModuleFiles((prev) => ({ ...prev, [modId]: data }));
          } else {
            setModuleFiles((prev) => ({ ...prev, [modId]: [] }));
          }
        } catch (err) {
          console.error("Fetch module files error:", err);
          setModuleFiles((prev) => ({ ...prev, [modId]: [] }));
        } finally {
          setLoadingFilesModuleId(null); // stop loading
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex">
      {/* Sidebar */}
      <Sidebar
        onCollapseChange={(value) => setIsCollapsed(value)}
        userRole="instructor"
      />

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          isCollapsed ? "ml-14" : "ml-44"
        )}
      >
        <main className="flex-1 p-6 md:p-10 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold text-gradient">
                Welcome back, Professor!
              </h2>
              <p className="text-muted-foreground">
                Manage your courses and upload materials below.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="purple-gradient">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Course
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] bg-white shadow-lg rounded-xl border border-gray-200">
                  <DialogHeader>
                    <DialogTitle>Create New Course</DialogTitle>
                    <DialogDescription>
                      Fill in the details below to create your course.
                    </DialogDescription>
                  </DialogHeader>
                  <CourseForm
                    onSubmit={handleCreateCourse}
                    onCancel={() => setIsCreateDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* CONDITIONAL CONTENT */}
          {selectedCourse ? (
            <div className="flex min-h-screen bg-white">
              {/* Sidebar */}
              <aside className="w-60 border-r border-gray-200 p-6 space-y-6">
                <div className="text-xl font-bold">{selectedCourse.title}</div>

                <nav className="flex flex-col space-y-4">
                  <button
                    className={`text-left ${
                      activeTab === "home"
                        ? "font-semibold text-blue-600 border-l-4 pl-2 border-blue-600"
                        : "text-gray-700 hover:text-blue-600"
                    }`}
                    onClick={() => setActiveTab("home")}
                  >
                    Home
                  </button>
                  <button
                    className={`text-left ${
                      activeTab === "modules"
                        ? "font-semibold text-blue-600 border-l-4 pl-2 border-blue-600"
                        : "text-gray-700 hover:text-blue-600"
                    }`}
                    onClick={() => setActiveTab("modules")}
                  >
                    Modules
                  </button>
                  <button
                    className={`text-left ${
                      activeTab === "people"
                        ? "font-semibold text-blue-600 border-l-4 pl-2 border-blue-600"
                        : "text-gray-700 hover:text-blue-600"
                    }`}
                    onClick={() => setActiveTab("people")}
                  >
                    People
                  </button>
                  <button
                    className={`text-left ${
                      activeTab === "settings"
                        ? "font-semibold text-blue-600 border-l-4 pl-2 border-blue-600"
                        : "text-gray-700 hover:text-blue-600"
                    }`}
                    onClick={() => setActiveTab("settings")}
                  >
                    Course Settings
                  </button>
                </nav>

                <Button
                  variant="outline"
                  onClick={handleBackToDashboard}
                  className="mt-10"
                >
                  ← Back to Courses
                </Button>
              </aside>

              {/* Main Content */}
              <main className="flex-1 p-8">
                {activeTab === "home" && selectedCourse && (
                  <section>
                    <h2 className="text-2xl font-bold mb-4">Home</h2>
                    <div className="space-y-8">
                      <Card className="glass-effect border-white/10">
                        <CardHeader>
                          <CardTitle>{selectedCourse.title}</CardTitle>
                          <CardDescription>
                            {selectedCourse.code} • {selectedCourse.term}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <strong>Description:</strong>{" "}
                            {selectedCourse.description}
                          </div>
                          <div>
                            <strong>Access Code:</strong>{" "}
                            {selectedCourse.accessCode}
                          </div>
                          <div>
                            <strong>Students Enrolled:</strong>{" "}
                            {selectedCourse.students}
                          </div>
                          <div>
                            <strong>Status:</strong>{" "}
                            {selectedCourse.published
                              ? "Published"
                              : "Unpublished"}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </section>
                )}

                {activeTab === "modules" && (
                  <section>
                    <h2 className="text-2xl font-bold mb-6">Modules</h2>

                    {/* For student only, make sure to take this out */}
                    {previewingFile ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center mt-4 gap-4">
                          <Button
                            variant="outline"
                            onClick={() => setPreviewingFile(null)}
                          >
                            ← Back to Modules
                          </Button>

                          {/* <Button onClick={handlePersonalize}>
                            Personalize
                          </Button> */}
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900">
                          {previewingFile.title}
                        </h2>
                        <iframe
                          src={`http://localhost:8080/instructor/files/${previewingFile.id}/content`}
                          title={previewingFile.title}
                          className="w-full h-[80vh] border rounded-lg shadow-sm"
                        />
                      </div>
                    ) : (
                      <>
                        {/* Add Module (stacked) */}
                        <div className="mb-6 border p-6 rounded-lg shadow-sm bg-white">
                          <h3 className="text-lg font-semibold mb-4">
                            Add Module
                          </h3>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Module Title"
                              value={newModuleTitle}
                              onChange={(e) =>
                                setNewModuleTitle(e.target.value)
                              }
                              className="w-full p-3 rounded border border-gray-300 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring focus:ring-blue-300"
                            />
                            <Button
                              onClick={handleAddModule}
                              disabled={!newModuleTitle}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                        {/* Collapsible Modules */}
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-2">
                            Your Modules
                          </h3>
                          <ul className="space-y-2">
                            {modules.map((mod) => (
                              <li key={mod.id}>
                                <div
                                  className={`flex items-center justify-between p-3 rounded-md border cursor-pointer ${
                                    selectedModuleId === mod.id
                                      ? "bg-blue-100 border-blue-400"
                                      : "hover:bg-gray-50"
                                  }`}
                                  onClick={() => handleToggleModule(mod.id)}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                      <span className="text-black">
                                        {selectedModuleId === mod.id
                                          ? "▼"
                                          : "▶"}
                                      </span>
                                      <span className="font-medium text-gray-900">
                                        {mod.title}
                                      </span>
                                    </div>
                                    <button
                                      className="text-red-500 hover:text-red-700"
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent expanding/collapsing
                                        handleDeleteModule(mod.id);
                                      }}
                                      title="Delete module"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>

                                {/* Expanded Module Section */}
                                {selectedModuleId === mod.id && (
                                  <div className="mt-3 border border-gray-300 rounded-lg bg-gray-50 shadow-sm p-4 space-y-4">
                                    <UploadPdf
                                      onUpload={(file) =>
                                        handleUploadPdf(
                                          selectedCourse.id,
                                          file,
                                          mod.id
                                        )
                                      }
                                      uploading={
                                        uploadingModuleId === mod.id
                                      }
                                      moduleId={mod.id}
                                    />

                                    <UploadAudio
                                      onUpload={(file) =>
                                        handleUploadAudio(
                                          selectedCourse.id,
                                          file,
                                          mod.id
                                        )
                                      }
                                      uploading={
                                        uploadingAudioModuleId === mod.id
                                      }
                                      moduleId={mod.id}
                                    />

                                    <div className="border-t pt-3 space-y-2">
                                      <h5 className="text-sm font-semibold text-gray-700">
                                        Files
                                      </h5>
                                      {loadingFilesModuleId === mod.id ? (
                                        <p className="text-sm text-blue-600 italic">
                                          Loading files…
                                        </p>
                                      ) : Array.isArray(moduleFiles[mod.id]) &&
                                        moduleFiles[mod.id].length > 0 ? (
                                        moduleFiles[mod.id].map((file) => (
                                          <div
                                            key={file.id}
                                            className="flex justify-between items-center cursor-pointer text-blue-600 hover:underline"
                                          >
                                            <span
                                              onClick={() =>
                                                setPreviewingFile(file)
                                              }
                                            >
                                              📄 {file.title}
                                            </span>
                                            <button
                                              className="text-red-500 hover:text-red-700 ml-2"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteFile(
                                                  file.id,
                                                  mod.id
                                                );
                                              }}
                                              title="Delete file"
                                            >
                                              <Trash2 size={16} />
                                            </button>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-sm text-gray-500 italic">
                                          No files uploaded yet.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {/* Search
                        <div className="mb-6">
                          <input
                            type="text"
                            placeholder="Search your course materials..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full p-3 rounded border border-gray-300 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring focus:ring-blue-300"
                          />
                          <Button onClick={handleSearch} className="mt-2">
                            Search
                          </Button>
                        </div>

                        {/* Search results */}
                        {/* <div className="space-y-4">
                          {results.map((chunk, index) => (
                            <Card
                              key={index}
                              className="w-full p-6 bg-white border border-gray-300 shadow-md"
                            >
                              <p className="text-xl text-gray-900 whitespace-pre-wrap leading-relaxed">
                                {chunk.content}
                              </p>
                            </Card>
                          ))}
                        </div> */}
                      </>
                    )}
                  </section>
                )}

                {/* modules content goes here */}
                {activeTab === "people" && (
                  <section>
                    <h2 className="text-2xl font-bold mb-4">People</h2>
                    {loadingStudents ? (
                      <p className="text-sm text-blue-600 italic">
                        Loading students…
                      </p>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {enrolledStudents.map((student) => (
                          <Card
                            key={student.enrollmentId}
                            className="p-4 flex flex-col justify-between"
                          >
                            <div>
                              <h3 className="text-lg font-semibold">
                                {student.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {student.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Enrolled:{" "}
                                {new Date(
                                  student.enrolledAt
                                ).toLocaleDateString()}
                              </p>
                            </div>

                            <div className="mt-4">
                              {confirmingDeleteStudentId !==
                              student.enrollmentId ? (
                                <Button
                                  variant="destructive"
                                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                                  onClick={() =>
                                    setConfirmingDeleteStudentId(
                                      student.enrollmentId
                                    )
                                  }
                                >
                                  Remove Student
                                </Button>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  <p className="text-sm text-red-600 font-medium">
                                    Confirm removal of this student?
                                  </p>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="destructive"
                                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                      onClick={() =>
                                        handleDeleteStudent(
                                          student.enrollmentId
                                        )
                                      }
                                    >
                                      Confirm
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className="flex-1"
                                      onClick={() =>
                                        setConfirmingDeleteStudentId(null)
                                      }
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {activeTab === "settings" && editedCourse && (
                  <section className="space-y-6">
                    <h2 className="text-2xl font-bold">Course Settings</h2>
                    <h2 className="mt-6 border-t border-gray-200 pt-6 font-bold">
                      Edit Course
                    </h2>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        await handleUpdateCourseInfo(editedCourse);

                        setSaveSuccess(true);
                        setTimeout(() => setSaveSuccess(false), 3000);
                      }}
                      className="space-y-4 max-w-xl"
                    >
                      <div>
                        <label className="block text-sm font-medium py-2">
                          Title
                        </label>
                        <input
                          type="text"
                          value={editedCourse.title}
                          onChange={(e) =>
                            setEditedCourse({
                              ...editedCourse,
                              title: e.target.value,
                            })
                          }
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium py-2">
                          Code
                        </label>
                        <input
                          type="text"
                          value={editedCourse.code}
                          onChange={(e) =>
                            setEditedCourse({
                              ...editedCourse,
                              code: e.target.value,
                            })
                          }
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium py-2">
                          Term
                        </label>
                        <select
                          value={editedCourse.term}
                          onChange={(e) =>
                            setEditedCourse({
                              ...editedCourse,
                              term: e.target.value,
                            })
                          }
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select a term</option>
                          <option value="Fall 2024">Fall 2024</option>
                          <option value="Spring 2025">Spring 2025</option>
                          <option value="Summer 2025">Summer 2025</option>
                          <option value="Fall 2025">Fall 2025</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium py-2">
                          Description
                        </label>
                        <textarea
                          value={editedCourse.description}
                          onChange={(e) =>
                            setEditedCourse({
                              ...editedCourse,
                              description: e.target.value,
                            })
                          }
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <Button type="submit">Save Changes</Button>
                      {saveSuccess && (
                        <span className="ml-4 text-green-600 text-sm font-medium">
                          Saved!
                        </span>
                      )}
                    </form>

                    <div className="">
                      <h2 className="mt-6 border-t border-gray-200 pt-6 font-bold">
                        Publish/Unpublish Course
                      </h2>
                      {/* Publish/Unpublish toggle */}
                      <div className="py-4">
                        <Button
                          onClick={() => handlePublishToggle(editedCourse.id)}
                          className={`\ ${
                            !editedCourse.published ? " text-white" : ""
                          }`}
                          variant={
                            editedCourse.published ? "outline" : "default"
                          }
                        >
                          {editedCourse.published
                            ? "Unpublish Course"
                            : "Publish Course"}
                        </Button>
                      </div>

                      {/* Delete course */}
                      <div className="mt-6 border-t border-gray-200 pt-6 font-bold">
                        {!confirmingDelete ? (
                          <Button
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => setConfirmingDelete(true)}
                          >
                            Delete Course
                          </Button>
                        ) : (
                          <div className="flex flex-col gap-3">
                            <p className="text-red-600 text-sm  font-semibold">
                              Are you sure you want to delete this course?
                            </p>
                            <div className="flex gap-4">
                              <Button
                                variant="destructive"
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => handleDeleteCourse(editedCourse)}
                              >
                                Confirm Delete
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setConfirmingDelete(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                )}
              </main>
            </div>
          ) : (
            // Default Dashboard with Courses Tabs
            <Tabs defaultValue="all" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList className="bg-muted">
                  <TabsTrigger value="all">All Courses</TabsTrigger>
                  <TabsTrigger value="published">Published</TabsTrigger>
                  <TabsTrigger value="unpublished">Unpublished</TabsTrigger>
                </TabsList>
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-72 bg-muted border-border"
                />
              </div>

              <TabsContent
                value="all"
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch"
              >
                {filteredCourses.map((course: any) => (
                  <div
                    key={course.id}
                    onClick={() => handleCourseClick(course)}
                    className="cursor-pointer"
                  >
                    <CourseCard
                      course={course}
                      uploading={uploadingModuleId === course.id}
                      onEdit={() => setEditingCourse(course)}
                      onPublishToggle={() => handlePublishToggle(course.id)}
                      onUploadPdf={handleUploadPdf}
                      showUploadButton={
                        selectedCourse?.id === course.id &&
                        activeTab === "modules"
                      }
                    />
                  </div>
                ))}
              </TabsContent>

              <TabsContent
                value="published"
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {filteredCourses
                  .filter((c: any) => c.published)
                  .map((course: any) => (
                    <div
                      key={course.id}
                      onClick={() => handleCourseClick(course)}
                      className="cursor-pointer"
                    >
                      <CourseCard
                        course={course}
                        uploading={uploadingModuleId === course.id}
                        onEdit={() => setEditingCourse(course)}
                        onPublishToggle={() => handlePublishToggle(course.id)}
                        onUploadPdf={handleUploadPdf}
                        showUploadButton={
                          selectedCourse?.id === course.id &&
                          activeTab === "modules"
                        }
                      />
                    </div>
                  ))}
              </TabsContent>

              <TabsContent
                value="unpublished"
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {filteredCourses
                  .filter((c: any) => !c.published)
                  .map((course: any) => (
                    <div
                      key={course.id}
                      onClick={() => handleCourseClick(course)}
                      className="cursor-pointer"
                    >
                      <CourseCard
                        course={course}
                        uploading={uploadingModuleId === course.id}
                        onEdit={() => setEditingCourse(course)}
                        onPublishToggle={() => handlePublishToggle(course.id)}
                        onUploadPdf={handleUploadPdf}
                        showUploadButton={
                          selectedCourse?.id === course.id &&
                          activeTab === "modules"
                        }
                      />
                    </div>
                  ))}
              </TabsContent>
            </Tabs>
          )}
        </main>
        <div className="h-1/4">
          <Footer />
        </div>
      </div>

      {/* Edit Course Dialog */}
      {editingCourse && (
        <Dialog
          open={!!editingCourse}
          onOpenChange={(open) => !open && setEditingCourse(null)}
        >
          <DialogContent className="sm:max-w-[600px] bg-white shadow-lg rounded-xl border border-gray-200">
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
              <DialogDescription>
                Update your course details below.
              </DialogDescription>
            </DialogHeader>
            <CourseForm
              course={editingCourse}
              onSubmit={handleUpdateCourseInfo}
              onCancel={() => setEditingCourse(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
