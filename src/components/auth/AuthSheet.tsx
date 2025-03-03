
import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

interface AuthSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "login" | "signup";
}

const AuthSheet = ({ open, onOpenChange, defaultTab = "login" }: AuthSheetProps) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    onOpenChange(false);
    navigate("/dashboard");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader className="mb-6">
          <SheetTitle>Welcome</SheetTitle>
          <SheetDescription>
            Sign in to your account or create a new one to get started.
          </SheetDescription>
        </SheetHeader>
        <Tabs
          defaultValue={defaultTab}
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <LoginForm onSuccess={handleAuthSuccess} />
          </TabsContent>
          <TabsContent value="signup">
            <SignupForm onSuccess={() => setActiveTab("login")} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default AuthSheet;
