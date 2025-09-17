// Authentication page from blueprint:javascript_auth_all_persistance
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, registrationSchema, LoginData, RegistrationData } from "@shared/schema";
import { AlertCircle, QrCode, Users, BarChart3 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const onLogin = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegistrationData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-4rem)]">
          {/* Left side - Hero section */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                QR Event Manager
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                Create stunning events, generate custom QR codes with backgrounds, and manage registrations with our advanced form builder.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-lg bg-white/50 backdrop-blur-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Custom QR Codes</h3>
                  <p className="text-sm text-muted-foreground">Generate QR codes with backgrounds and custom sizing</p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-lg bg-white/50 backdrop-blur-sm">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">User Management</h3>
                  <p className="text-sm text-muted-foreground">Complete admin interface for user control</p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-lg bg-white/50 backdrop-blur-sm">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Form Builder</h3>
                  <p className="text-sm text-muted-foreground">Drag & drop form builder with responsive design</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Auth forms */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Welcome</CardTitle>
                <CardDescription>
                  {activeTab === "login" ? "Sign in to your account" : "Create a new account"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-4">
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          type="text"
                          {...loginForm.register("username")}
                          disabled={loginMutation.isPending}
                        />
                        {loginForm.formState.errors.username && (
                          <p className="text-sm text-destructive">{loginForm.formState.errors.username.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          {...loginForm.register("password")}
                          disabled={loginMutation.isPending}
                        />
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      {loginMutation.error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{loginMutation.error.message}</AlertDescription>
                        </Alert>
                      )}

                      <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                        {loginMutation.isPending ? "Signing in..." : "Sign in"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="register" className="space-y-4">
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reg-username">Username</Label>
                        <Input
                          id="reg-username"
                          type="text"
                          {...registerForm.register("username")}
                          disabled={registerMutation.isPending}
                        />
                        {registerForm.formState.errors.username && (
                          <p className="text-sm text-destructive">{registerForm.formState.errors.username.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reg-email">Email</Label>
                        <Input
                          id="reg-email"
                          type="email"
                          {...registerForm.register("email")}
                          disabled={registerMutation.isPending}
                        />
                        {registerForm.formState.errors.email && (
                          <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reg-password">Password</Label>
                        <Input
                          id="reg-password"
                          type="password"
                          {...registerForm.register("password")}
                          disabled={registerMutation.isPending}
                        />
                        {registerForm.formState.errors.password && (
                          <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      {registerMutation.error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{registerMutation.error.message}</AlertDescription>
                        </Alert>
                      )}

                      <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                        {registerMutation.isPending ? "Creating account..." : "Create account"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}