import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const courses = ["Advanced Stock Trading", "Cryptocurrency Fundamentals", "Personal Finance Mastery"];

const CoursesList = ({ search, setSearch }: { search: string; setSearch: (value: string) => void }) => {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  //const [file, setFile] = useState<File | null>(null);
  //const fileInputRef = useRef<HTMLInputElement | null>(null);

  // const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   if (event.target.files) {
  //     setFile(event.target.files[0]);
  //   }
  // };

  // const handleUpload = async () => {
  //   if (!file) return;

  //   const formData = new FormData();
  //   formData.append("file", file);

  //   // const response = await fetch("/api/upload", {
  //   //   method: "POST",
  //   //   body: formData,
  //   // });

  //   // const data = await response.json();
  //   // console.log("Uploaded:", data);
  // };

  return (
    <div
      className={cn(
        "transition-all duration-300",
        isExpanded ? "fixed inset-0 bg-black z-50 flex items-center justify-center p-6" : "relative"
      )}
    >
      <Card
        className={cn(
          "bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20 shadow-lg transition-all duration-300",
          isExpanded ? "w-full max-w-4xl h-full p-6 overflow-auto" : "w-full"
        )}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        <CardHeader className="relative flex justify-between items-center">
          <CardTitle className="text-xl text-blue-400">Courses and Topics</CardTitle>
          {isExpanded && (
            <Button
              variant="ghost"
              className="absolute top-3 right-3"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
            >
              <X className="h-6 w-6 text-white" />
            </Button>
          )}
        </CardHeader>

        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              placeholder="Search courses..."
              className="bg-gray-800 text-white border-blue-500/30"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {/* <input
              type="file"
              accept="application/pdf"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
            /> */}
            
          </div>
          {/* {file && (
            <div className="mt-3 flex items-center gap-3">
              <span className="text-white">{file.name}</span>
              <Button onClick={handleUpload} className="bg-green-600 hover:bg-green-700 text-white">
                Confirm Upload
              </Button>
            </div>
          )} */}
          <ul className="space-y-4 mt-4">
            {courses.map((course, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg">
                <span className="text-white">{course}</span>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => router.push("/learn")}
                >
                  Learn <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoursesList;