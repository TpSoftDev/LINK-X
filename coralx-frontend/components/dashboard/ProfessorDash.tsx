"use client";

import { useState, useEffect } from "react";
import { Plus, LayoutDashboard } from "lucide-react";
import Link from "next/link";

import Sidebar from "@/components/link-x/DashSidebar";
import AudioUpload from "@/components/dashboard/AudioUpload";
import { Button } from "@/components/ui/button";
import Footer from "@/components/landing/Footer";
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

// Sample courses
// const initialCourses = [
//   { id: "1", title: "Introduction to Computer Science", code: "CS101", term: "Fall 2024", students: 45, published: true, lastUpdated: "2024-04-15" },
//   { id: "2", title: "Data Structures and Algorithms", code: "CS201", term: "Fall 2024", students: 32, published: true, lastUpdated: "2024-04-10" },
//   { id: "3", title: "Database Systems", code: "CS301", term: "Fall 2024", students: 28, published: false, lastUpdated: "2024-04-05" },
//   { id: "4", title: "Machine Learning", code: "CS401", term: "Spring 2025", students: 0, published: false, lastUpdated: "2024-04-01" },
// ];

export default function ProfessorDashboard() {
  type Course = {
    id: string;
    title: string;
    description?: string;
    code: string;
    term: string;
    published: boolean;
    lastUpdated: string;
  };

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"modules" | "people" | "settings">(
    "modules"
  );
  const [editedCourse, setEditedCourse] = useState<Course | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [uploading, setUploading]   = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ content: string }[]>([]);

  const handleSearch = async () => {
    if (!query || !selectedCourse) return;

    try {
      const res = await fetch(`http://localhost:8080/courses/${selectedCourse.id}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");

      setResults(data.results);
    } catch (err) {
      console.error("Search error:", err);
      alert("Error searching content");
    }
  };

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
  

  const handleUploadPdf = async (courseId: string, file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
  
      const res = await fetch(`http://localhost:8080/courses/${courseId}/upload`, {
        method: "POST",
        body: formData,
      });
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
  
      alert(`✅ ${data.message}`);
    } catch (err) {
      alert(`❌ Error: ${(err as Error).message}`);
    } finally {
      setUploading(false);
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

  const handleCourseClick = (course: any) => {
    setSelectedCourse(course);
  };

  const handleBackToDashboard = () => {
    setSelectedCourse(null);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex">
      {/* Sidebar */}
      <Sidebar onCollapseChange={(value) => setIsCollapsed(value)} />

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
                {activeTab === "modules" && (
                  <section>
                    <h2 className="text-2xl font-bold mb-4">Modules</h2>

                    <div className="mb-6">
                      <UploadPdf
                        onUpload={(file) => handleUploadPdf(selectedCourse.id, file)}
                        uploading={uploading}
                      />
                    </div>
                        {/* Search input */}
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Search your course materials..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full p-3 rounded border border-gray-300 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring focus:ring-blue-300"
                      />
                      <Button onClick={handleSearch} className="mt-2">Search</Button>
                    </div>

                    {/* Search results */}
                    <div className="space-y-4">
                      {results.map((chunk, index) => (
                        <Card key={index} className="p-4 bg-gray-50 border border-gray-200">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{chunk.content}</p>
                        </Card>
                      ))}
                    </div>
                  
                  </section>
                )}
                {activeTab === "people" && (
                  <section>
                    <h2 className="text-2xl font-bold mb-4">People</h2>
                    <ul className="space-y-2">
                      {[
                        { name: "Alice Johnson", role: "Student" },
                        { name: "Bob Smith", role: "Student" },
                        { name: "Charlie Brown", role: "Professor" },
                        { name: "Diana Prince", role: "Professor" },
                        { name: "Ethan Hunt", role: "Student" },
                      ].map((person, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between p-3 rounded-md border border-gray-200 shadow-sm hover:bg-gray-50 transition"
                        >
                          <span className="font-medium text-gray-900">
                            {person.name}
                          </span>
                          <span className="text-sm text-gray-500">
                            {person.role}
                          </span>
                        </li>
                      ))}
                    </ul>
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
                      uploading={uploading}
                      onEdit={() => setEditingCourse(course)}
                      onPublishToggle={() => handlePublishToggle(course.id)}
                      onUploadPdf={handleUploadPdf}
                      showUploadButton={
                        selectedCourse?.id === course.id && activeTab === "modules"
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
                        uploading={uploading}
                        onEdit={() => setEditingCourse(course)}
                        onPublishToggle={() => handlePublishToggle(course.id)}
                        onUploadPdf={handleUploadPdf}
                        showUploadButton={
                          selectedCourse?.id === course.id && activeTab === "modules"
                        }
                      />
                    </div>
                  ))}
              </TabsContent>

              <TabsContent
                value="unpublished"
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >f
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
                        uploading={uploading}
                        onEdit={() => setEditingCourse(course)}
                        onPublishToggle={() => handlePublishToggle(course.id)}
                        onUploadPdf={handleUploadPdf}
                        showUploadButton={
                          selectedCourse?.id === course.id && activeTab === "modules"
                        }
                      />
                    </div>
                  ))}
              </TabsContent>
            </Tabs>
          )}

          <Footer />
        </main>
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
