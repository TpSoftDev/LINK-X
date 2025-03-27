// components/RecentlyCompletedCourses.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const RecentlyCompletedCourses: React.FC = () => {
  const completedCourses = [
    "Introduction to Investing",
    "Financial Statement Analysis",
    "Risk Management Basics",
  ];

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-blue-400">
          Recently Completed Courses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {completedCourses.map((course, index) => (
            <Card key={index} className="bg-gray-800/50 border-blue-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white">{course}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">2 days ago</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentlyCompletedCourses;
