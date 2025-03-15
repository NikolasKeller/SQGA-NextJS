"use client";

// Removed these two problematic imports:
// import { ProgressIndicator } from "../components/progress-indicator"
// import { DebugPanel } from "../components/debug-panel"

import { useState } from "react";

// Inline Modal-Komponente
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  specifications: {
    type: string;
    count: number;
  }[];
}

function SpecificationModal({ isOpen, onClose, onConfirm, specifications }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Spezifikationen bestätigen</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-medium mb-2">Extrahierte Spezifikationen:</h3>
          <ul className="space-y-2">
            {specifications.map((spec, index) => (
              <li key={index} className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>{spec.count} {spec.type}-Spezifikationen</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Zurück
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Zum Angebot fortfahren
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeStep, setActiveStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [specifications, setSpecifications] = useState([
    { type: "Material", count: 1 },
    { type: "Technische", count: 3 }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleGenerate = () => {
    setIsModalOpen(true);
  };

  const handleModalConfirm = () => {
    setIsModalOpen(false);
    setIsGenerating(true);
    
    // Simuliere den Generierungsprozess
    setTimeout(() => {
      setIsGenerating(false);
      setIsGenerated(true);
      setActiveStep(3);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-blue-600 font-bold text-2xl">dryft</span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-600">Switch to English</button>
            <button className="text-gray-600">⚙️</button>
            <button className="text-gray-600">🔔</button>
            <button className="text-gray-600">👤</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-semibold text-center mb-8">Angebotsgenerator</h1>
        
        {/* Steps */}
        <div className="flex mb-8">
          <div className={`flex-1 p-4 ${activeStep === 1 ? 'bg-white shadow-md' : 'bg-gray-100'}`}>
            <span className="font-medium">1. Dokumente hochladen</span>
          </div>
          <div className={`flex-1 p-4 ${activeStep === 2 ? 'bg-white shadow-md' : 'bg-gray-100'}`}>
            <span className="font-medium">2. Anforderungen eingeben</span>
          </div>
          <div className={`flex-1 p-4 ${activeStep === 3 ? 'bg-white shadow-md' : 'bg-gray-100'}`}>
            <span className="font-medium">3. Angebot prüfen</span>
          </div>
        </div>

        {/* Step 1 Content */}
        {activeStep === 1 && (
          <div>
            <p className="mb-6">Laden Sie Ihre PDF-Dokumente hoch. Diese werden analysiert, um relevante Informationen zu extrahieren.</p>
            
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 text-gray-400 mb-4">↑</div>
                <p className="mb-2">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500">PDF (max 10MB)</p>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".pdf" 
                  onChange={handleFileChange}
                  id="file-upload"
                />
                <label 
                  htmlFor="file-upload" 
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700"
                >
                  Datei auswählen
                </label>
              </div>
            </div>

            {file && (
              <div className="mt-4 p-4 bg-white rounded-lg shadow">
                <p className="font-medium">Ausgewählte Datei:</p>
                <p>{file.name}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2 Content */}
        {activeStep === 2 && (
          <div>
            <p className="mb-6">Spezifikationen eingeben</p>
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h2 className="text-lg font-medium mb-4">Anforderungen</h2>
              <textarea 
                className="w-full p-4 border border-gray-300 rounded-lg" 
                rows={6}
                placeholder="Beschreiben Sie Ihre Anforderungen..."
              ></textarea>
            </div>
          </div>
        )}

        {/* Step 3 Content */}
        {activeStep === 3 && (
          <div>
            <p className="mb-6">Ihr Angebot wurde generiert.</p>
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h2 className="text-lg font-medium mb-4">Angebot</h2>
              <div className="border p-4 rounded-lg">
                <h3 className="font-medium mb-2">Angebot für Projekt XYZ</h3>
                <p className="text-sm text-gray-600 mb-4">Basierend auf Ihren Spezifikationen</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Material:</span>
                    <span>€1,250.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Arbeit:</span>
                    <span>€750.00</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Gesamt:</span>
                    <span>€2,000.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        <SpecificationModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onConfirm={handleModalConfirm}
          specifications={specifications}
        />

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          {activeStep > 1 && (
            <button 
              className="px-4 py-2 bg-gray-200 rounded-md"
              onClick={() => setActiveStep(activeStep - 1)}
            >
              Zurück
            </button>
          )}
          {activeStep < 2 && (
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-md ml-auto"
              onClick={() => setActiveStep(activeStep + 1)}
              disabled={!file}
            >
              Weiter
            </button>
          )}
          {activeStep === 2 && (
            <button 
              className="px-4 py-2 bg-green-600 text-white rounded-md ml-auto"
              onClick={handleGenerate}
            >
              Generieren
            </button>
          )}
          {activeStep === 3 && (
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-md ml-auto"
            >
              Herunterladen
            </button>
          )}
        </div>

        {/* Loading State */}
        {isGenerating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-lg font-medium">Angebot wird generiert...</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}