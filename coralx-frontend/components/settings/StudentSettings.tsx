"use client";
import Header from "@/components/link-x/Header";
import Footer from "@/components/landing/Footer";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button
} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckedState } from "@radix-ui/react-checkbox";
import {
  ArrowLeft,
  Bell,
  Shield,
  Moon,
  UserCircle
} from "lucide-react";

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

interface AccountData {
  email: string;
  password: string;
}

const StudentSettings = () => {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();

  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [formData, setFormData] = useState<OnboardingData>({
    name: "",
    job: "",
    traits: "",
    learningStyle: "",
    depth: "",
    topics: "",
    interests: "",
    schedule: "",
    quizzes: false,
  });
  const [accountData, setAccountData] = useState<AccountData>({
    email: "",
    password: "",
  });
  const [passwordError, setPasswordError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Determine user role only once when component mounts
  useEffect(() => {
    const determineRole = async () => {
      try {
        const res = await fetch(`${API}/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          // If the user is not authenticated or the endpoint failed, default to professor
          setIsStudent(false);
          return;
        }

        const data = await res.json(); // expected shape: { id, email, role, ... }

        if (data?.role === "student") {
          setIsStudent(true);
        } else {
          setIsStudent(false);
        }
      } catch (err) {
        console.error("Failed to determine role:", err);
        setIsStudent(false);
      } finally {
        setLoading(false);
      }
    };

    determineRole();
  }, [API]);

  // Fetch Onboarding (students only)
  useEffect(() => {
    if (!isStudent) return;
    fetch(`${API}/student/profile`, {
      method: "GET",
      credentials: "include",
    })
      .then(async res => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setFormData({
          name: data.name,
          job: data.onboard_answers?.job || "",
          traits: data.onboard_answers?.traits || "",
          learningStyle: data.onboard_answers?.learningStyle || "",
          depth: data.onboard_answers?.depth || "",
          topics: data.onboard_answers?.topics || "",
          interests: data.onboard_answers?.interests || "",
          schedule: data.onboard_answers?.schedule || "",
          quizzes: data.want_quizzes ?? false,
        });
        
      })
      .catch(err => console.error("Failed to load onboarding:", err));
  }, [API, isStudent]);
  

  // We already fetch /me below for email; No additional account endpoint needed.

  useEffect(() => {
    fetch(`${API}/me`, {
      method: "GET",
      credentials: "include",
    })
      .then(async res => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setAccountData({ email: data.email ?? "", password: "" });
      })
      .catch(err => console.error("Failed to load email:", err));
  }, []);
  

  const handleChange = (value: string, name: keyof OnboardingData) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleCheckboxChange = (checked: CheckedState, name: keyof OnboardingData) => {
    setFormData(prev => ({ ...prev, [name]: checked === true }));
  };

  const handleUpdateOnboarding = async () => {
    const payload = {
      name: formData.name,
      onboard_answers: {
        job: formData.job,
        traits: formData.traits,
        learningStyle: formData.learningStyle,
        depth: formData.depth,
        topics: formData.topics,
        interests: formData.interests,
        schedule: formData.schedule,
      },
      want_quizzes: formData.quizzes,
    };
  
    try {
      const res = await fetch(`${API}/student/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/dashboard");
    } catch (e) {
      console.error("❌", e);
    }
  };
  
  const updateEmailAndPassword = async (email: string, password?: string) => {
    if (password && password.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }
  
    setPasswordError("");
  
  
    try {
      const res = await fetch(`${API}/me`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password: password || undefined,  // Send password only if defined
        }),
      });
  
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }
  
      router.push("/dashboard"); // Redirect to dashboard on success
    } catch (e) {
      console.error("❌ Failed to update account info:", e);
    }
  };
  
  const handleAccountUpdate = () => {
    updateEmailAndPassword(accountData.email, accountData.password);
  };
  

  const [notifications, setNotifications] = useState<boolean>(true);
  const [privacy, setPrivacy] = useState<boolean>(true);

  return (
    <div className="flex flex-col min-h-screen w-full pt-24 pb-12 px-4 md:px-6">
      <Header isLoggedIn={true} />
      <div className="max-w-[900px] mx-auto w-full mb-12">
        <div className="mb-8 flex items-center">
          <Link href="/dashboard" className="flex items-center text-black hover:text-blue-400 mr-4">
            <ArrowLeft size={20} className="mr-2" />
            Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="account" className="flex items-center justify-center gap-2">
              <UserCircle size={18} /> Account
            </TabsTrigger> 
            {isStudent && !loading && (
              <TabsTrigger value="onboarding" className="flex items-center justify-center gap-2">
                <Moon size={18} /> Onboarding
              </TabsTrigger>
            )}
            <TabsTrigger value="notifications" className="flex items-center justify-center gap-2">
              <Bell size={18} /> Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center justify-center gap-2">
              <Shield size={18} /> Privacy
            </TabsTrigger>
          </TabsList>

          {/* ACCOUNT */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account information and preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="Enter your email"
                    value={accountData.email}
                    onChange={e =>
                      setAccountData(prev => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full bg-muted rounded-md p-2 text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Change your password"
                    value={accountData.password}
                    onChange={e =>
                      setAccountData(prev => ({ ...prev, password: e.target.value }))
                    }
                    className="w-full bg-muted rounded-md p-2 text-foreground"
                  />
                  {passwordError && (
                    <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleAccountUpdate}>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* ONBOARDING */}
          {isStudent && (
            <TabsContent value="onboarding">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Onboarding</CardTitle>
                  <CardDescription>Customize how the AI responds to you.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="onboardingName">What should Learn-X call you?</Label>
                  <Input
                    id="onboardingName"
                    type="text"
                    name="name"
                    value={formData.name || ""}
                    onChange={e => handleChange(e.target.value, "name")}
                  />
                  <Label htmlFor="job">What do you do?</Label>
                  <Input
                    id="job"
                    type="text"
                    name="job"
                    placeholder="e.g., Student, Engineer"
                    value={formData.job || ""}
                    onChange={e => handleChange(e.target.value, "job")}
                  />

                  <Label htmlFor="traits">What traits should Learn-X have?</Label>
                  <Input
                    id="traits"
                    type="text"
                    name="traits"
                    placeholder="e.g., witty, encouraging"
                    value={formData.traits || ""}
                    onChange={e => handleChange(e.target.value, "traits")}
                  />

                  <Label>Learning Style</Label>
                  <Select
                    value={formData.learningStyle}
                    onValueChange={v => handleChange(v, "learningStyle")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20 shadow-lg text-gray-100">
                      <SelectItem value="visual">Visual</SelectItem>
                      <SelectItem value="auditory">Auditory</SelectItem>
                      <SelectItem value="games">Games</SelectItem>
                      <SelectItem value="text-based">Text-Based</SelectItem>
                    </SelectContent>
                  </Select>

                  <Label>Depth of Explanation</Label>
                  <Select
                    value={formData.depth}
                    onValueChange={v => handleChange(v, "depth")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select depth" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20 shadow-lg text-gray-100">
                      <SelectItem value="concise">Concise Summaries</SelectItem>
                      <SelectItem value="detailed">In-depth Explanations</SelectItem>
                    </SelectContent>
                  </Select>

                  <Label htmlFor="topics">Topics of Interest</Label>
                  <Input
                    id="topics"
                    type="text"
                    name="topics"
                    placeholder="e.g., Finance, Biology"
                    value={formData.topics || ""}
                    onChange={e => handleChange(e.target.value, "topics")}
                  />

                  <Label htmlFor="interests">Interests, Preferences</Label>
                  <Input
                    id="interests"
                    type="text"
                    name="interests"
                    placeholder="e.g., Basketball, Music"
                    value={formData.interests || ""}
                    onChange={e => handleChange(e.target.value, "interests")}
                  />

                  <Label>Study Schedule</Label>
                  <Select
                    value={formData.schedule}
                    onValueChange={v => handleChange(v, "schedule")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select schedule" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20 shadow-lg text-gray-100">
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center mt-4">
                    <Checkbox
                      checked={formData.quizzes}
                      onCheckedChange={c => handleCheckboxChange(c, "quizzes")}
                    />
                    <Label htmlFor="quizzes" className="ml-2">
                      Include quizzes
                    </Label>
                  </div>

                  <Button
                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleUpdateOnboarding}
                  >
                    Update Preferences
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* NOTIFICATIONS */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Manage your notifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive device alerts</p>
                  </div>
                  <Switch
                    checked={notifications}
                    onCheckedChange={checked => setNotifications(checked)}
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Email Alerts</p>
                    <p className="text-sm text-muted-foreground">Receive email updates</p>
                  </div>
                  <Switch checked={true} onCheckedChange={() => {}} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PRIVACY */}
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Manage your privacy preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Profile Visibility</p>
                    <p className="text-sm text-muted-foreground">Who can see your info</p>
                  </div>
                  <Switch checked={privacy} onCheckedChange={c => setPrivacy(c)} />
                </div>
                <div className="space-y-1">
                  <Label>Data Usage</Label>
                  <p className="text-sm text-muted-foreground">
                    We collect anonymized data to improve your experience.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Manage Data Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default StudentSettings;