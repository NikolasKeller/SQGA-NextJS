import { PDFProcessor } from '@/components/PDFProcessor'
import { SearchBar } from '@/components/SearchBar'
import { ResultsDisplay } from '@/components/ResultsDisplay'

export default function Home() {
  return (
    <main className="py-8">
      <h1 className="text-3xl font-bold mb-8">PDF DRYFT</h1>
      
      <div className="space-y-8">
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">PDF Verarbeitung</h2>
          <PDFProcessor />
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Suche</h2>
          <SearchBar />
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Ergebnisse</h2>
          <ResultsDisplay />
        </section>
      </div>
    </main>
  )
}
