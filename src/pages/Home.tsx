import { useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ProgressBar from '@/components/ProgressBar';
import ReviewTable from '@/components/ReviewTable';
import Footer from '@/components/Footer';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useReviewStore } from '@/store/useReviewStore';

export default function Home() {
  const { loadFromStorage, currentReview } = useReviewStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <ProgressBar />
            <ReviewTable />
          </div>
        </main>

        <Footer />
      </div>

      <ConfirmDialog />

      {currentReview && (
        <div className="fixed top-6 right-6 z-40">
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full" />
            已自动保存
          </div>
        </div>
      )}
    </div>
  );
}
