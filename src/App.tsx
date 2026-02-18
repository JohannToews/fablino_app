import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { KidProfileProvider } from "@/hooks/useKidProfile";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import OfflineBanner from "@/components/OfflineBanner";
import HomeClassic from "./pages/HomeClassic";
import HomeFablino from "./pages/HomeFablino";
import { FEATURES } from "./config/features";
import AdminPage from "./pages/AdminPage";
import AdminConfigPage from "./pages/AdminConfigPage";
import StorySelectPage from "./pages/StorySelectPage";
import ReadingPage from "./pages/ReadingPage";
import VocabularyQuizPage from "./pages/VocabularyQuizPage";
import VocabularyManagePage from "./pages/VocabularyManagePage";
import ResultsPage from "./pages/ResultsPage";
import CollectionPage from "./pages/CollectionPage";
import FeedbackStatsPage from "./pages/FeedbackStatsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";
import CreateStoryPage from "./pages/CreateStoryPage";
import InstallPage from "./pages/InstallPage";
import ShareRedirectPage from "./pages/ShareRedirectPage";
import StickerBookPage from "./pages/StickerBookPage";
import WelcomePage from "./pages/WelcomePage";
import OnboardingKindPage from "./pages/OnboardingKindPage";
import OnboardingStoryPage from "./pages/OnboardingStoryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <KidProfileProvider>
          <Toaster />
        <Sonner />
        <OfflineBanner />
        <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />
            <Route path="/install" element={<InstallPage />} />
            <Route path="/s/:token" element={<ShareRedirectPage />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/onboarding/kind" element={<OnboardingKindPage />} />
            <Route path="/onboarding/story" element={<OnboardingStoryPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                {FEATURES.NEW_FABLINO_HOME ? <HomeFablino /> : <HomeClassic />}
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute skipKidCheck>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/config" element={
              <ProtectedRoute skipKidCheck>
                <AdminConfigPage />
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
            <Route path="/collection" element={
              <ProtectedRoute>
                <CollectionPage />
              </ProtectedRoute>
            } />
            <Route path="/sticker-buch" element={
              <ProtectedRoute>
                <StickerBookPage />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </ErrorBoundary>
        </KidProfileProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
