import { Header } from '@/components/Header'
import BecomeAuthorPage from '@/components/BecomeAuthorPage'
import Footer from '@/components/Footer'

export default function AuthorsPage() {
  return (
    <div className="min-h-screen bg-[#161717]">
      <Header />
      <main className="pt-0">
        <BecomeAuthorPage />
      </main>
      <Footer />
    </div>
  )
}
