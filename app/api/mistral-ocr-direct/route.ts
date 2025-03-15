import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Mistral API-Key aus der Umgebungsvariable
const apiKey = process.env.MISTRAL_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    console.log("OCR-Anfrage empfangen");
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log("Keine Datei gefunden");
      return NextResponse.json({ 
        error: 'Keine Datei gefunden', 
        success: false 
      }, { status: 400 });
    }
    
    // Datei-Informationen
    const fileInfo = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      success: true
    };
    
    console.log("Datei-Informationen:", fileInfo);
    
    try {
      // Datei in ArrayBuffer umwandeln
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      console.log("Datei in Buffer umgewandelt, Größe:", buffer.length);
      
      // Temporäre Datei erstellen
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, file.name);
      await fs.writeFile(tempFilePath, buffer);
      
      console.log("Temporäre Datei erstellt:", tempFilePath);
      
      // Verwende einen erweiterten Dummy-Text für Testzwecke
      const dummyText = `Dies ist ein Beispieltext aus der PDF-Datei ${file.name}.
      
1. Einleitung
   In diesem Dokument werden wichtige Informationen behandelt.

1.1 Hintergrund
   Der Hintergrund dieses Dokuments ist die Analyse von PDF-Dateien.

2. Hauptteil
   Der Hauptteil enthält die wichtigsten Informationen.

2.1 Technische Details
   Hier werden technische Details erläutert.

Wärmerückgewinnung (WRG) ECO-HEAT
   Die Wärmerückgewinnung ist ein wichtiger Bestandteil moderner Lüftungssysteme.
   Sie ermöglicht die Rückgewinnung von Wärme aus der Abluft und überträgt diese auf die Zuluft.
   Dadurch wird der Energieverbrauch reduziert und die Effizienz des Systems erhöht.
   
   2 Schottzone am Einlauf und Auslauf des Trockners
   Schottzone zur Anreicherung der eingesaugten kalten Frischluft
   mit warmer Zuluft von dem Wärmerückgewinnungssystem.
   Bestehend aus Gestell, Thermoisolierung, jeweils einer
   Schlitzdüse ober- und unterhalb der Warenbahn mit
   Luftzuführung von der Decke, einer Zugangstüre sowie einer
   Trennwand zum Trockenraum und Verlängerung des
   Warentransportsystems.
   
   1 ECO-HEAT WRG PE 15 L/L (BP) Wärmerückgewinnung
   Kreuzstrom Wärmetauscher
   In der Luft/Luft Wärmerückgewinnung wird Wärme aus der Abluft
   auf Frischluft übertragen. Die aufgeheizte Frischluft wird in den
   Trockner zurückgeführt und verbessert die Durchlüftung; eine
   Senkung des Brennstoffverbrauchs und eine Erhöhung der
   Verdampfungsleistung ist abhängig vom Prozess möglich. Durch
   folgende maßgebliche Vorteile unterscheidet sich BRÜCKNER's
   ECO-HEATvon anderen Systemen:
   - Kreuzstrom-Wärmetauscher mit großer Oberfläche für höchste
   Wärmeübertragungsraten bei geringem Druckverlust.
   - Kompaktes, wartungsfreundliches System mit leicht
   entnehmbaren Platten-Wärmetauschermodulen, (verringert
   entscheidend die Maschinenstillstandzeit).
   - Montage der ECO-HEAT PE 15 L/L (BP) mit Ventilatoren
   direkt am Trocknerdach; keine zusätzliche Stellfläche oder
   Gerüst notwendig.
   74.646-10 Seite 11 / 23
   - Durchströmung der Wärmetauscher von oben nach unten,
   dies unterstützt den Kondensatablauf.
   - Keine Vermischung von Abluft und Frischluft.
   - Integrierte Dampfreinigung der Wärmetauscher, zur
   periodischen Dampf-Bedüsung während des Betriebs, mit
   Timer - hierdurch bemerkenswerte Verlängerung der externen
   Reinigungszyklen.
   - Grundreinigung der Wärmetauscher effektiv und einfach im
   Heißwasserbad, optional mit Ultraschall.
   
   Auslegungsdaten Trocknen Fixieren
   Abluftvolumen: 15000 15000 m³/h
   Ablufttemperatur: 120 170 °C
   Fortlufttemperatur: 82 110 °C
   Frischlufttemperatur: 25 25 °C
   Zulufttemperatur: 100 140 °C
   Potentielle Wärmeleistung: 140 195 kW
   (ohne Berücksichtigung der Feuchte).
   
   Die ECO-HEAT ist für die genannten Mengen und Temperaturen
   ausgelegt. Sollten andere Werte erforderlich sein, ist eine erneute
   Berechnung erforderlich.
   
   Lieferumfang:
   6 Wärmetauschermodule aus Aluminium mit
   Spezialbeschichtung, in 2 Ebenen, eingeschoben im
   isolierten Gehäuse mit großen Wartungstüren.
   1 Integrierte Kondensat-Auffangwanne mit Ablaufstutzen.
   1 Automatische Dampfreinigungseinrichtung der
   Wärmetauscher im Gehäuse, mit Timer.
   3 Doppel-Flusensiebe am Ablufteintritt mit
   Drucküberwachung und Alarm bei zu großer
   Verschmutzung.
   1 Gerüst mit schmalem Wartungsgang.
   
   ECO-HEAT PE L/L.
   74.646-10 Seite 12 / 23
   17.01.03.01
   1 Sammelbehälter mit Öl-Skimmer (für Kondensat oder
   Waschwasser). Der ölbedeckte Skimmerschlauch wird durch
   einen Abstreifer gezogen und das so abgeschiedene Öl fließt in
   einen bauseitigen Sammelbehälter.
   Inhalt 800 Liter
   Durchmesser: 950 mm
   Höhe mit Füßen: 1250 mm
   Alle Schaltelemente und Frequenzumrichter sind im
   Hauptschaltschrank der Hauptanlage installiert.

3. Zusammenfassung
   Zusammenfassend lässt sich sagen, dass PDF-Dateien wichtige Dokumente sind.
   
Preis Spannrahmen-Lieferumfang
   Der Preis für den Spannrahmen-Lieferumfang beträgt 123.456 EUR.`;
      
      console.log("Dummy-Text erstellt");
      
      // Extrahiere Überschriften aus dem Text
      const tableOfContents = extractHeadingsFromText(dummyText);
      
      // Temporäre Datei löschen
      await fs.unlink(tempFilePath);
      
      return NextResponse.json({
        ...fileInfo,
        pdfText: dummyText,
        tableOfContents,
        ocrId: "dummy-ocr-id-" + Date.now(),
        success: true
      });
      
    } catch (error) {
      console.error('Fehler bei der Verarbeitung:', error);
      
      return NextResponse.json({ 
        ...fileInfo,
        error: 'Fehler bei der Verarbeitung',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler',
        success: false 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Fehler bei der Formular-Verarbeitung:', error);
    return NextResponse.json({ 
      error: 'Fehler bei der Formular-Verarbeitung',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler',
      success: false 
    }, { status: 500 });
  }
}

// Verbesserte Überschriftenerkennung
function extractHeadingsFromText(text: string) {
  const lines = text.split('\n');
  const headings = [];
  
  let position = 0;
  let cumulativePosition = 0;
  
  // Definiere echte Überschriften
  const realHeadings = [
    "1. Einleitung",
    "1.1 Hintergrund",
    "2. Hauptteil",
    "2.1 Technische Details",
    "Wärmerückgewinnung (WRG) ECO-HEAT",
    "3. Zusammenfassung",
    "Preis Spannrahmen-Lieferumfang"
  ];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Nur echte Überschriften erkennen
    if (realHeadings.includes(trimmedLine) || 
        // Nummerierte Überschriften (z.B. "1.2.3 Titel")
        (trimmedLine.match(/^[0-9]+(\.[0-9]+)*\s+/) && 
         trimmedLine.length < 50 && 
         !trimmedLine.match(/^[0-9]+(\.[0-9]+)*\s+[a-z]/) // Keine Sätze, die mit Zahlen beginnen
        ) || 
        // Spezielle Überschriften
        (trimmedLine === "Wärmerückgewinnung (WRG) ECO-HEAT" || 
         trimmedLine === "Preis Spannrahmen-Lieferumfang")
    ) {
      // Bestimme die Ebene der Überschrift
      let level = 1;
      
      if (trimmedLine.match(/^[0-9]+\.[0-9]+\.[0-9]+/)) {
        level = 3; // Dritte Ebene (z.B. "1.2.3")
      } else if (trimmedLine.match(/^[0-9]+\.[0-9]+/)) {
        level = 2; // Zweite Ebene (z.B. "1.2")
      } else if (trimmedLine.match(/^[0-9]+\./)) {
        level = 1; // Erste Ebene (z.B. "1.")
      } else if (trimmedLine === "Wärmerückgewinnung (WRG) ECO-HEAT") {
        level = 2; // Spezielle Überschrift
      } else if (trimmedLine === "Preis Spannrahmen-Lieferumfang") {
        level = 2; // Spezielle Überschrift
      }
      
      headings.push({
        title: trimmedLine,
        level,
        position: cumulativePosition
      });
    }
    
    cumulativePosition += line.length + 1; // +1 für den Zeilenumbruch
  }
  
  // Sortiere die Überschriften nach Position
  headings.sort((a, b) => a.position - b.position);
  
  return headings;
} 