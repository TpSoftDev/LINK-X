import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

const courses = ["Advanced Stock Trading", "Cryptocurrency Fundamentals", "Personal Finance Mastery"];

const CoursesList = ({ search, setSearch }: { search: string; setSearch: (value: string) => void }) => {
  const router = useRouter();

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-blue-400">Courses and Topics</CardTitle>
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
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            <Plus className="h-5 w-5 mr-2" />
            Upload Course
          </Button>
        </div>
        <ul className="space-y-4 mt-4">
          {courses.map((course, index) => (
            <li key={index} className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg">
              <span className="text-white">{course}</span>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push("/learn")}>
                Learn <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default CoursesList;
