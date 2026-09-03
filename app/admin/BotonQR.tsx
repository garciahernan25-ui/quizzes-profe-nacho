"use client";

import { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";

export default function BotonQR({ slug, titulo }: { slug: string; titulo: string }) {
  const [mostrar, setMostrar] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/quiz/${slug}`;

  const descargarPDF = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const qrSize = 120;
    const x = (pageWidth - qrSize) / 2;

    // Título
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    const tituloLineas = pdf.splitTextToSize(titulo, 180);
    let yTitulo = 30;
    tituloLineas.forEach((linea: string) => {
      pdf.text(linea, pageWidth / 2, yTitulo, { align: "center" });
      yTitulo += 10;
    });

    // QR
    const qrY = yTitulo + 10;
    pdf.addImage(imgData, "PNG", x, qrY, qrSize, qrSize);

    // Texto inferior
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(16);
    pdf.text("¡Escaneá y jugá!", pageWidth / 2, qrY + qrSize + 15, { align: "center" });

    pdf.save(`qr-${slug}.pdf`);
  };

  const botonSecundario = {
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
    background: "#fff",
    color: "#000",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  } as const;

  return (
    <>
      <button
        onClick={() => setMostrar(!mostrar)}
        className="btn btn-sm btn-ghost"
        title="Generar QR"
      >
        QR
      </button>

      {mostrar && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setMostrar(false)}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "2rem",
              textAlign: "center",
              maxWidth: "90%",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 1rem", color: "#000" }}>
              {titulo}
            </h3>
            <div ref={qrRef}>
              <QRCodeCanvas value={url} size={220} bgColor="#ffffff" fgColor="#000000" />
            </div>
            <p style={{ marginTop: "1rem", color: "#333", wordBreak: "break-all" }}>
              {url}
            </p>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button type="button" onClick={descargarPDF} style={botonSecundario}>
                Descargar PDF
              </button>
              <button type="button" onClick={() => setMostrar(false)} style={botonSecundario}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}