"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard } from "lucide-react";

import Sidebar from "@/components/dashboard/DashSidebar";
import AudioUpload from "@/components/dashboard/AudioUpload";
import { Button } from "@/components/ui/button";
import Footer from "@/components/landing/Footer";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CourseCard } from "@/components/dashboard/StudentCourseCard";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function StudentDashboard() {
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

  interface OnboardingData {
    name: string;
    job: string;
    traits: string;
    learningStyle: string;
    depth: string;
    topics: string;
    interests: string;
    schedule: string;
    quizzes: boolean;
  }

  type Course = {
    id: string;
    title: string;
    code: string;
    term?: string;
    description?: string;
    published?: boolean;
  };

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"home" | "modules" | "people">(
    "home"
  );
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [modules, setModules] = useState<{ id: string; title: string }[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [loadingFiles, setLoadingFiles] = useState<string | null>(null); // store module ID being fetched
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [moduleFiles, setModuleFiles] = useState<Record<string, FileSummary[]>>(
    {}
  );
  const [previewingFile, setPreviewingFile] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(
    null
  );
  const router = useRouter();

  const isMedia =
  previewingFile?.title?.toLowerCase().endsWith(".mp3") ||
  previewingFile?.title?.toLowerCase().endsWith(".mp4") ||
  previewingFile?.title?.toLowerCase().endsWith(".wav") ||
  previewingFile?.title?.toLowerCase().endsWith(".m4a") ||
  previewingFile?.title?.toLowerCase().endsWith(".aac") ||
  previewingFile?.title?.toLowerCase().endsWith(".ogg") ||
  previewingFile?.title?.toLowerCase().endsWith(".flac") ||
  previewingFile?.title?.toLowerCase().endsWith(".wma") ||
  previewingFile?.title?.toLowerCase().endsWith(".aiff");

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const res = await fetch("http://localhost:8080/student/courses", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch courses");
        const data = await res.json();
        setCourses(data);
      } catch (err) {
        console.error("Error fetching courses:", err);
      }
    };
    fetchEnrollments();
  }, []);

  useEffect(() => {
    const fetchModules = async () => {
      if (!selectedCourse) return;
      try {
        const res = await fetch(
          `http://localhost:8080/student/courses/${selectedCourse.id}/modules`,
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
    const fetchClassmates = async () => {
      if (activeTab !== "people" || !selectedCourse?.id) return;
      setLoadingPeople(true);
      try {
        const res = await fetch(
          `http://localhost:8080/student/courses/${selectedCourse.id}/classmates`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to fetch classmates");
        const classmates = await res.json();
        const formatted = classmates.map((s: any, index: number) => ({
          id: index.toString(),
          name: s.name,
        }));
        setEnrolledStudents(formatted);
      } catch (err) {
        console.error("Error fetching classmates:", err);
        setEnrolledStudents([]);
      } finally {
        setLoadingPeople(false);
      }
    };

    fetchClassmates();
  }, [activeTab, selectedCourse]);

  useEffect(() => {
    fetch("http://localhost:8080/student/profile", {
      method: "GET",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch onboarding");
        const data = await res.json();

        setOnboardingData({
          name: data.name,
          job: data.onboard_answers?.job || "",
          traits: data.onboard_answers?.traits || "",
          learningStyle: data.onboard_answers?.learningStyle || "",
          depth: data.onboard_answers?.depth || "",
          topics: data.onboard_answers?.topics || "",
          interests: data.onboard_answers?.interests || "",
          schedule: data.onboard_answers?.schedule || "",
          quizzes: data.want_quizzes || false,
        });
      })
      .catch((err) => {
        console.error("❌ Error loading onboarding:", err);
      });
  }, []);

  const filteredCourses = courses
  .filter(
    (course): course is Course =>
      !!course &&
      typeof course.title === "string" &&
      typeof course.code === "string" &&
      course.published === true
  )
  .filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const handleCourseClick = (course: any) => {
    setSelectedCourse(course);
  };

  const handleBackToDashboard = () => {
    setSelectedCourse(null);
  };

  const handlePersonalize = async () => {
    if (!previewingFile || !onboardingData) return;

    const controller = new AbortController();
    setAbortController(controller);
    setIsGenerating(true);

    try {
      // Check for existing personalized file
      const checkRes = await fetch(
        "http://localhost:8080/student/personalized-files",
        {
          credentials: "include",
          signal: controller.signal,
        }
      );

      if (!checkRes.ok) throw new Error("Failed to check personalized files");

      const existingFiles = await checkRes.json();
      const match = existingFiles.find(
        (f: any) => f.originalFileId === previewingFile.id
      );

      if (match) {
        setIsGenerating(false);
        setAbortController(null);
        router.push(`/learn/${match.id}`);
        return;
      }

      // No match — send personalization request
      const payload = {
        name: onboardingData.name,
        message: "personalize this PDF",
        fileId: previewingFile.id,
        userProfile: {
          role: onboardingData.job,
          traits: onboardingData.traits,
          learningStyle: onboardingData.learningStyle,
          depth: onboardingData.depth,
          interests: onboardingData.interests,
          personalization: onboardingData.topics,
          schedule: onboardingData.schedule,
        },
      };

      const res = await fetch(
        "http://localhost:8080/generatepersonalizedfilecontent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Personalization failed");

      toast.success("Personalized content generated!");
      router.push(`/learn/${data.id}`);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.warn("❌ Personalization aborted by user.");
        toast.info("Personalization cancelled.");
      } else {
        console.error("Personalization failed:", err);
        toast.error("Something went wrong during personalization.");
      }
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  const handleToggleModule = async (modId: string) => {
    if (selectedModuleId === modId) {
      setSelectedModuleId(null); // collapse
    } else {
      setSelectedModuleId(modId); // expand

      if (!moduleFiles[modId]) {
        setLoadingFiles(modId); // set which module is loading
        try {
          const res = await fetch(
            `http://localhost:8080/student/modules/${modId}/files`,
            { credentials: "include" }
          );

          if (!res.ok) throw new Error("Failed to fetch files");
          const data = await res.json();

          setModuleFiles((prev) => ({
            ...prev,
            [modId]: Array.isArray(data) ? data : [],
          }));
        } catch (err) {
          console.error("Fetch module files error:", err);
          setModuleFiles((prev) => ({ ...prev, [modId]: [] }));
        } finally {
          setLoadingFiles(null);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex">
      <Sidebar
        onCollapseChange={(value) => setIsCollapsed(value)}
        userRole="student"
      />
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          isCollapsed ? "ml-14" : "ml-44"
        )}
      >
        <main className="flex-1 p-6 md:p-10 space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold text-gradient">
                Welcome back, Student!
              </h2>
              <p className="text-muted-foreground">
                Browse your enrolled courses below.
              </p>
            </div>
          </div>

          {selectedCourse ? (
            <div className="flex min-h-screen bg-white">
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
                </nav>
                <Button
                  variant="outline"
                  onClick={handleBackToDashboard}
                  className="mt-10"
                >
                  ← Back to Courses
                </Button>
              </aside>
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
                          {!isMedia && (
                            <Button onClick={handlePersonalize}>
                              Personalize
                            </Button>
                          )}
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900">
                          {previewingFile.title}
                        </h2>
                        <iframe
                          src={`http://localhost:8080/student/files/${previewingFile.id}/content`}
                          title={previewingFile.title}
                          className="w-full h-[80vh] border rounded-lg shadow-sm"
                        />
                      </div>
                    ) : (
                      <>
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
                                  <div className="flex items-center gap-2">
                                    <span className="text-black">
                                      {selectedModuleId === mod.id ? "▼" : "▶"}
                                    </span>
                                    <span className="font-medium text-gray-900">
                                      {mod.title}
                                    </span>
                                  </div>
                                </div>

                                {/* Expanded Module Section */}
                                {selectedModuleId === mod.id && (
                                  <div className="mt-3 border border-gray-300 rounded-lg bg-gray-50 shadow-sm p-4 space-y-4">
                                    <h5 className="text-sm font-semibold text-gray-700">
                                      Files
                                    </h5>
                                    {loadingFiles === mod.id ? (
                                      <p className="text-sm text-blue-500 italic">
                                        Loading files...
                                      </p>
                                    ) : moduleFiles[mod.id]?.length > 0 ? (
                                      moduleFiles[mod.id].map((file) => (
                                        <div
                                          key={file.id}
                                          onClick={() =>
                                            setPreviewingFile(file)
                                          }
                                          className="cursor-pointer text-blue-600 hover:underline"
                                        >
                                          📄 {file.title}
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-sm text-gray-500 italic">
                                        No files uploaded yet.
                                      </p>
                                    )}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </section>
                )}

                {activeTab === "people" && (
                  <section>
                    <h2 className="text-2xl font-bold mb-4">People</h2>
                    <div className="space-y-4">
                      {loadingPeople ? (
                        <p className="text-blue-500 italic">
                          Loading classmates...
                        </p>
                      ) : enrolledStudents.length > 0 ? (
                        enrolledStudents.map((student) => (
                          <div
                            key={student.id}
                            className="p-4 border rounded-lg shadow-sm bg-white"
                          >
                            <div className="text-lg font-semibold">
                              {student.name}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          No classmates found.
                        </p>
                      )}
                    </div>
                  </section>
                )}
              </main>
            </div>
          ) : (
            <Tabs defaultValue="all" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList className="bg-muted">
                  <TabsTrigger value="all">All Courses</TabsTrigger>
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
                className="min-h-[300px] flex items-center justify-center"
              >
                {filteredCourses.length === 0 ? (
                  <div className="text-center text-muted-foreground text-lg">
                    You are not enrolled in any courses yet.
                    <br />
                    Reach out to your instructor or check back later.
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch w-full">
                    {filteredCourses.map((course: any) => (
                      <div
                        key={course.id}
                        onClick={() => handleCourseClick(course)}
                        className="cursor-pointer"
                      >
                        <CourseCard course={course} />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </main>
        <div className="h-1/4">
          <Footer />
        </div>
      </div>
      {isGenerating && (
        <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex flex-col items-center justify-center">
          <button
            className="absolute top-6 right-6 text-gray-500 hover:text-gray-800 text-3xl"
            onClick={() => {
              abortController?.abort(); // Cancel the request
              setIsGenerating(false); // Hide the loader
            }}
          >
            ×
          </button>
          <h2 className="text-xl font-semibold text-blue-700 mb-4">
            Loading personalized content...
          </h2>
          <div className="w-1/2 bg-blue-100 rounded-full h-4 overflow-hidden">
            <div className="bg-blue-600 h-full animate-pulse w-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}