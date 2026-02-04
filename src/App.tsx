import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { KidProfileProvider } from "@/hooks/useKidProfile";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import AdminPage from "./pages/AdminPage";
import StorySelectPage from "./pages/StorySelectPage";
import ReadingPage from "./pages/ReadingPage";
import VocabularyQuizPage from "./pages/VocabularyQuizPage";
import VocabularyManagePage from "./pages/VocabularyManagePage";
import ResultsPage from "./pages/ResultsPage";
import FeedbackStatsPage from "./pages/FeedbackStatsPage";
import LoginPage from "./pages/LoginPage";
import CreateStoryPage from "./pages/CreateStoryPage";
import InstallPage from "./pages/InstallPage";
// Registration disabled - users are created by admin only
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <KidProfileProvider>
          <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/install" element={<InstallPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/stories" element={
              <ProtectedRoute>
                <StorySelectPage />
              </ProtectedRoute>
            } />
            <Route path="/read/:id" element={
              <ProtectedRoute>
                <ReadingPage />
              </ProtectedRoute>
            } />
            <Route path="/quiz" element={
              <ProtectedRoute>
                <VocabularyQuizPage />
              </ProtectedRoute>
            } />
            <Route path="/words" element={
              <ProtectedRoute>
                <VocabularyManagePage />
              </ProtectedRoute>
            } />
            <Route path="/results" element={
              <ProtectedRoute>
                <ResultsPage />
              </ProtectedRoute>
            } />
            <Route path="/feedback-stats" element={
              <ProtectedRoute>
                <FeedbackStatsPage />
              </ProtectedRoute>
            } />
            <Route path="/create-story" element={
              <ProtectedRoute>
                <CreateStoryPage />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </KidProfileProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
